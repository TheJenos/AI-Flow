"use client"

import { Dispatch, SetStateAction, useState } from "react";
import Editor, { Monaco } from '@monaco-editor/react';
import { editor } from 'monaco-editor';

type SchemaEditorProps = {
    defaultValue?: string,
    schema?: object,
    onErrorChange?: Dispatch<SetStateAction<editor.IMarker[]>>
    onChange: (value?: string) => void
}

export default function JsonEditor({ defaultValue, schema, onErrorChange, onChange }: SchemaEditorProps) {
    const [errors, setErrors] = useState<editor.IMarker[]>([])

    const onMount = (editor: editor.ICodeEditor, monaco: Monaco) => {
        editor.updateOptions({ minimap: { enabled: false } });
        if (schema) {
            monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
                validate: true,
                allowComments: false,
                enableSchemaRequest: false,
                schemas: [{
                    uri: "http://myserver/schemas/my-schema.json",
                    fileMatch: ["*"],
                    schema
                }],
                schemaValidation: "error"
            });
        } else {
            monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
                validate: true,
                allowComments: false,
                enableSchemaRequest: false,
                schemas: [],
                schemaValidation: "error"
            });
        }
    }

    return (
        <div>
            <div className="flex flex-col">
                {errors.map((x, index) => (
                    <div key={index} className="bg-red-500 text-white text-xs p-1">
                        {x.message} (Line: {x.startLineNumber})
                    </div>
                ))}
            </div>
            <Editor
                height={'30vh'}
                language="json"
                className="border rounded-md"
                theme="vs-dark"
                onMount={onMount}
                defaultValue={defaultValue}
                onValidate={(e) => {
                    setErrors(e)
                    if (onErrorChange) {
                        onErrorChange(e)
                    }
                }}
                onChange={onChange}
            />
        </div>

    )

}