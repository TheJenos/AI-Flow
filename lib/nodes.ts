import PromptNode from "@/components/nodes/prompt";
import StartNode, {Properties as StartProperties} from "@/components/nodes/start";

type NodeDetails = {
    name: string;
    description: string;
    node: typeof StartNode;
    properties: typeof StartProperties;
    type: string;
    notAddable?: boolean;
}

export const nodeDetails: NodeDetails[] = [
    { 
        name: 'Start Node',
        description: 'The first node in the flow. Please add a your initial values here.',
        node: StartNode,
        properties: StartProperties,
        type: 'start',
        notAddable: true
    },
    {
        name: 'Prompt',
        description: 'Generate a response based on the given prompt',
        node: PromptNode,
        properties: StartProperties,
        type: 'prompt'
    },
    {
        name: 'Action',
        description: 'Perform a specific action in the flow',
        node: StartNode,
        properties: StartProperties,
        type: 'start'
    },
];

export const nodeTypes = Object.fromEntries(nodeDetails.map(node => [node.type, node.node]));

export const getNodeDetails = (type: string | undefined) => {
    return nodeDetails.find(node => node.type === type);
}
