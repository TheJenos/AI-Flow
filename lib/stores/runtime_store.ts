import Decimal from "decimal.js-light";
import { create } from "zustand";
import { NodeLogs } from "./flow_store";
import { NodeState } from "../nodes";

export type RuntimeState = {
    isRunning: boolean;
    nodeStates: {
        [key: string]: NodeState
    }
    logs: NodeLogs[];
    startTime?: number,
    endTime?: number,
    inToken: number;
    outToken: number;
    amount: number;
    start: () => void;
    stop: () => void;
    log: (payload: NodeLogs) => void;
    setNodeState: (nodeStates: { [key: string]: NodeState }) => void;
    setNodeStateFromNodeId: (nodeId: string, state: NodeState) => void;
    increaseInToken: (amount: number) => void;
    increaseOutToken: (amount: number) => void;
    increaseAmount: (amount: Decimal) => void;
    setInToken: (inToken: number) => void;
    setOutToken: (outToken: number) => void;
    setAmount: (amount: number) => void;
};

export const useRuntimeStore = create<RuntimeState>()(set => ({
    isRunning: false,
    nodeStates: {},
    logs: [],
    startTime: undefined,
    endTime: undefined,
    duration: 0,
    inToken: 0,
    outToken: 0,
    amount: 0,
    start: () => set({ isRunning: true, startTime: new Date().getTime(), endTime: undefined, inToken: 0, outToken: 0, amount: 0, logs: [] }),
    stop: () => set({ isRunning: false, endTime: new Date().getTime() }),
    log: (payload) => set((state) => ({ logs: [...state.logs, payload] })),
    setNodeState: (nodeStates) => set({ nodeStates }),
    setNodeStateFromNodeId: (nodeId, nodeState) => set((state) => ({ nodeStates: { ...state.nodeStates, [nodeId]: nodeState } })),
    increaseInToken: (amount) => set((state) => ({ inToken: state.inToken + amount })),
    increaseOutToken: (amount) => set((state) => ({ outToken: state.outToken + amount })),
    increaseAmount: (amount) => set((state) => ({ amount: new Decimal(state.amount).add(amount).toNumber() })),
    setInToken: (inToken) => set({ inToken }),
    setOutToken: (outToken) => set({ outToken }),
    setAmount: (amount) => set({ amount }),
}));