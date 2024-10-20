"use client"

import { PenBox } from "lucide-react";
import { Button } from "./button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./dialog";
import { useState } from "react";
import { Input } from "./input";
import { Label } from "./label";
import { cloneDeep, set } from "lodash";
import { editor } from 'monaco-editor';
import JsonEditor from "./json_editor";

type SchemaEditorProps = {
  defaultValue?: SchemaType,
  onSave: (value: SchemaType) => void
}

export type SchemaType = {
  name: string,
  description?: string,
  strict?: boolean,
  schema: object
}

const schemaStyle = {
  type: "object",
  properties: {
    title: {
      type: "string"
    },
    description: {
      type: "string"
    },
    type: {
      type: "string",
      enum: [
        "object",
        "array",
        "string",
        "number",
        "boolean",
        "null",
        "integer"
      ]
    },
    properties: {
      type: "object",
      additionalProperties: {
        $ref: "#"
      }
    },
    items: {
      anyOf: [
        {
          $ref: "#"
        },
        {
          type: "array",
          items: {
            $ref: "#"
          }
        }
      ]
    },
    required: {
      type: "array",
      items: {
        type: "string"
      },
      uniqueItems: true
    },
    additionalProperties: {
      anyOf: [
        {
          type: "boolean"
        },
        {
          $ref: "#"
        }
      ]
    },
    definitions: {
      type: "object",
      additionalProperties: {
        $ref: "#"
      }
    },
    enum: {
      type: "array",
      minItems: 1,
      items: {
        type: [
          "string",
          "number",
          "boolean",
          "null",
          "object",
          "array"
        ]
      }
    },
    const: {
      type: [
        "string",
        "number",
        "boolean",
        "null",
        "object",
        "array"
      ]
    },
    format: {
      type: "string"
    },
    minLength: {
      type: "integer",
      minimum: 0
    },
    maxLength: {
      type: "integer",
      minimum: 0
    },
    pattern: {
      type: "string",
      format: "regex"
    },
    minimum: {
      type: "number"
    },
    maximum: {
      type: "number"
    },
    exclusiveMinimum: {
      type: "number"
    },
    exclusiveMaximum: {
      type: "number"
    },
    anyOf: {
      type: "array",
      minItems: 1,
      items: {
        $ref: "#"
      }
    },
    not: {
      $ref: "#"
    }
  },
  required: [
    "type",
  ],
  additionalProperties: false
}

export default function SchemaEditor({ defaultValue, onSave }: SchemaEditorProps) {
  const [schema, setSchema] = useState<SchemaType | undefined>(defaultValue)
  const [errors, setErrors] = useState<editor.IMarker[]>([])

  const setValue = (key: string, value: string | boolean) => {
    const clonedSchema = cloneDeep(schema) || {
      name: "",
      schema: {}
    }
    set(clonedSchema, key, value)
    setSchema(clonedSchema)
  }

  return (
    <div className='rounded-md relative'>
      <div className="bg-accent p-2 text-xs rounded-md whitespace-pre-wrap max-h-28 overflow-y-auto border border-gray-300">
        {schema?.name || 'Not assigned'}
      </div>
      <div className="absolute top-1 right-1">
        <Dialog>
          <DialogTrigger asChild>
            <Button toolTip="Schema Editor" variant="ghost" className="h-6 w-6 p-1" size="icon">
              <PenBox size={10} />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-screen-md overflow-visible">
            <DialogHeader>
              <DialogTitle>
                <h2 className="text-lg font-medium">Schema Editor</h2>
              </DialogTitle>
              <DialogDescription>
                <p className="text-sm text-gray-500">Edit and manage your schema definitions with ease and precision.</p>
              </DialogDescription>
            </DialogHeader>
            <div className='flex flex-col gap-1'>
              <Label>Name</Label>
              <Input
                name="name"
                value={schema?.name}
                onChange={(e) => setValue('name', e.target.value)}
              />
            </div>
            <div className='flex flex-row gap-1'>
              <Label>Strict Mode</Label>
              <input
                name="strict"
                type="checkbox"
                checked={schema?.strict}
                onChange={(e) => setValue('strict', e.target.checked)}
              />
            </div>
            <div className='flex flex-col gap-1'>
              <Label>Schema <span className={errors.length == 0 ? 'text-green-600' : 'text-red-600'}>{errors.length == 0 ? '(Valid)' : '(Invalid)'}</span></Label>
              <JsonEditor
                defaultValue={JSON.stringify(defaultValue?.schema || {
                  type: "object",
                  properties: {}
                }, null, 4)}
                schema={schemaStyle}
                onErrorChange={setErrors}
                onChange={(s) => {
                  try {
                    if (s) setValue('schema', JSON.parse(s))
                  } catch { }
                }}
              />
            </div>
            <DialogFooter>
              <DialogClose asChild><Button disabled={!schema || !schema.name || errors.length > 0} onClick={() => schema && onSave(schema)}>Save</Button></DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}