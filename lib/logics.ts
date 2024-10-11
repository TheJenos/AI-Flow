import { get } from "lodash";
import { AppContext } from "./nodes";

export const valueReg = new RegExp('\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}', 'gm')

const filterStatement = (statement: string) => {
    if(!statement) return ''
    return statement.replaceAll(/(?<![<>!])=(?!=)/g, "==").replaceAll('===', '==');
}

export const replaceDynamicValueWithActual = (statement: string, context: AppContext, forFunction = false) => {
    const filteredStatement = filterStatement(statement)
    const allTemplateWords = filteredStatement.match(valueReg) || []
    const valueMap = Object.fromEntries(allTemplateWords.map(x => [x, get(context, x.substring(1,x.length -1))]))
    return Object.keys(valueMap).reduce((c, x) => {
        return c.replaceAll(x, (forFunction ? JSON.stringify(valueMap[x]): valueMap[x]) as string)
    }, filteredStatement) 
}

export const replaceDynamicValueWithDummyValues = (statement: string) => {
    const filteredStatement = filterStatement(statement)
    const allTemplateWords = filteredStatement.match(valueReg) || []
    const valueMap = Object.fromEntries(allTemplateWords.map(x => [x, 0]))
    return Object.keys(valueMap).reduce((c, x) => {
        return c.replaceAll(x, JSON.stringify(valueMap[x]) as string)
    }, filteredStatement) 
}

export const runStatement = (statement: string, context: AppContext) => {
    const logic = `return ${replaceDynamicValueWithActual(statement, context, true)}`
    try {
        return new Function(logic)()
    } catch (error) {
        console.log(logic, error);
        return false
    }
}

export const validateStatement = (statement: string = '') => {
    const logic = `return ${replaceDynamicValueWithDummyValues(statement)}`
    try {
        new Function(logic)()
        return true
    } catch {
        return false
    }
}