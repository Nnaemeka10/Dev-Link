import { Languages } from "../constants"


export const findFLags = (language: string) => (
    Languages.find(l => l.language === language)
)