import axios, { AxiosResponse } from 'axios'
import Decimal from 'decimal.js-light'

export const modelDetails = [
    {
      "title": "gpt-4o",
      "name": "gpt-4o",
      "tokenPrice": 0.00250
    },
    {
      "title": "gpt-4o-mini",
      "name": "gpt-4o-mini",
      "tokenPrice": 0.000150
    },
    {
      "title": "gpt-4o-2024-08-06",
      "name": "gpt-4o-2024-08-06",
      "tokenPrice": 0.003750
    },
    {
      "title": "gpt-4o-mini-2024-07-18",
      "name": "gpt-4o-mini-2024-07-18",
      "tokenPrice": 0.000300
    },
    {
      "title": "gpt-3.5-turbo",
      "name": "gpt-3.5-turbo",
      "tokenPrice": 0.003000
    },
    {
      "title": "davinci-002",
      "name": "davinci-002",
      "tokenPrice": 0.012000
    },
    {
      "title": "babbage-002",
      "name": "babbage-002",
      "tokenPrice": 0.001600
    },
    {
      "title": "chatgpt-4o-latest",
      "name": "chatgpt-4o-latest",
      "tokenPrice": 0.0050
    },
    {
      "title": "gpt-4-turbo",
      "name": "gpt-4-turbo",
      "tokenPrice": 0.0100
    },
    {
      "title": "gpt-4-turbo-2024-04-09",
      "name": "gpt-4-turbo-2024-04-09",
      "tokenPrice": 0.0100
    },
    {
      "title": "gpt-4",
      "name": "gpt-4",
      "tokenPrice": 0.0300
    },
    {
      "title": "gpt-4-32k",
      "name": "gpt-4-32k",
      "tokenPrice": 0.0600
    },
    {
      "title": "gpt-4-0125-preview",
      "name": "gpt-4-0125-preview",
      "tokenPrice": 0.0100
    },
    {
      "title": "gpt-4-1106-preview",
      "name": "gpt-4-1106-preview",
      "tokenPrice": 0.0100
    },
    {
      "title": "gpt-4-vision-preview",
      "name": "gpt-4-vision-preview",
      "tokenPrice": 0.0100
    },
    {
      "title": "gpt-3.5-turbo-0125",
      "name": "gpt-3.5-turbo-0125",
      "tokenPrice": 0.0005
    },
    {
      "title": "gpt-3.5-turbo-instruct",
      "name": "gpt-3.5-turbo-instruct",
      "tokenPrice": 0.0015
    },
    {
      "title": "gpt-3.5-turbo-1106",
      "name": "gpt-3.5-turbo-1106",
      "tokenPrice": 0.0010
    },
    {
      "title": "gpt-3.5-turbo-0613",
      "name": "gpt-3.5-turbo-0613",
      "tokenPrice": 0.0015
    },
    {
      "title": "gpt-3.5-turbo-16k-0613",
      "name": "gpt-3.5-turbo-16k-0613",
      "tokenPrice": 0.0030
    },
    {
      "title": "gpt-3.5-turbo-0301",
      "name": "gpt-3.5-turbo-0301",
      "tokenPrice": 0.0015
    },
    {
      "title": "davinci-002",
      "name": "davinci-002",
      "tokenPrice": 0.0020
    },
    {
      "title": "babbage-002",
      "name": "babbage-002",
      "tokenPrice": 0.0004
    }
];

export type Message = {
    role: 'system' | 'user' | 'assistant',
    content?: string
} 

export type ChatPayload = {
    model: string;
    messages: Message[];
    temperature?: number;
    max_tokens?: number;
    top_p?: number;
    frequency_penalty?: number;
    presence_penalty?: number;
    response_format?: {
      type: 'text' | 'json_object' | 'json_schema',
      json_schema?: unknown
    }
}

export type ChatCompletion = {
    id: string;
    object: string;
    created: number;
    model: string;
    system_fingerprint: string;
    choices: {
        index: number;
        message: Message;
        logprobs: null | unknown;
        finish_reason: string;
    }[];
    usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
        completion_tokens_details: {
            reasoning_tokens: number;
        };
    };
};

export function openAiTokenToCost(tokenCount: number, model: string): Decimal {
    return (new Decimal(modelDetails.find(x => x.title == model)?.tokenPrice || 0)).mul(tokenCount).div(1000) ;
}

export function OpenAiFaker(output?: string) {
    return {
        chat: (payload: ChatPayload) => new Promise<AxiosResponse<ChatCompletion>>((resolve) => {
            setTimeout(() => {
                resolve({
                    data: {
                        id: 'fake-id',
                        object: 'chat.completion',
                        created: Date.now(),
                        model: payload.model,
                        system_fingerprint: 'fake-fingerprint',
                        choices: [{
                            index: 0,
                            message: {
                                role: 'assistant',
                                content: output || ''
                            },
                            logprobs: null,
                            finish_reason: 'stop'
                        }],
                        usage: {
                            prompt_tokens: 10,
                            completion_tokens: 10,
                            total_tokens: 20,
                            completion_tokens_details: {
                                reasoning_tokens: 5
                            }
                        }
                    },
                    status: 200,
                    statusText: 'OK',
                    headers: {},
                    config: {},
                    request: {}
                } as AxiosResponse<ChatCompletion>)
            }, 1000);
        })
    }
}

export function OpenAi(token: string) {
    const client = axios.create({
        baseURL: 'https://api.openai.com/v1',
        headers: {
            "Content-Type": 'application/json',
            "Authorization": `Bearer ${token}`
        }
    })

    return {
        chat: (payload: ChatPayload) => client.post<ChatCompletion,AxiosResponse<ChatCompletion>>('/chat/completions', payload) 
    }
}