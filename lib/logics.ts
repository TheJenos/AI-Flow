import { get } from "lodash";
import { AppContext } from "./nodes";

const valueReg = new RegExp('\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}', 'gm')

export const replaceDynamicValueWithActual = (statement: string, context: AppContext, forFunction = false) => {
    const allTemplateWords = statement.match(valueReg) || []
    const valueMap = Object.fromEntries(allTemplateWords.map(x => [x, get(context, x.substring(1,x.length -1))]))
    return Object.keys(valueMap).reduce((c, x) => {
        return c.replace(x, (forFunction ? JSON.stringify(valueMap[x]): valueMap[x]) as string)
    }, statement) 
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