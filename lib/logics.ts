import { get } from "lodash";
import { AppContext } from "./nodes";
import safeEval from 'safe-eval'

export const valueReg = new RegExp('\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}', 'gm')

export const headlights = [
    {
        highlight: valueReg,
        className: "font-semibold text-blue-600 bg-white", //tw
    },
]

const filterStatement = (statement: string) => {
    if(!statement) return ''
    return statement.replaceAll(/(?<![<>!])=(?!=)/g, "==").replaceAll('===', '==');
}

export const replaceDynamicValueWithActual = (statement: string, context: AppContext) => {
    const filteredStatement = filterStatement(statement)
    const allTemplateWords = filteredStatement.match(valueReg) || []
    const valueMap = Object.fromEntries(allTemplateWords.map(x => [x, get(context, x.substring(1, x.length - 1)) as unknown as string]))
    return Object.keys(valueMap).reduce((c, x) => {
        return c.replaceAll(x, valueMap[x] as string)
    }, filteredStatement) 
}

export const replaceDynamicValueWithValueRef = (statement: string) => {
    const filteredStatement = filterStatement(statement)
    const allTemplateWords = filteredStatement.match(valueReg) || []
    return allTemplateWords.reduce((c, x) => {
        return c.replaceAll(x, x.substring(1,x.length -1))
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
    const logic = `(function () { return ${replaceDynamicValueWithValueRef(statement)} })()`
    try {
        return safeEval(logic, context)
    } catch (error) {
        console.log(logic, error);
        return false
    }
}

export const validateStatement = (statement: string = '') => {
    const logic = `(function () { return ${replaceDynamicValueWithDummyValues(statement)} })()`
    try {
        safeEval(logic)
        return true
    } catch {
        return false
    }
}