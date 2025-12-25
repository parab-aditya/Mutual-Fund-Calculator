/**
 * Hook for running financial optimization in a Web Worker
 * Keeps the main thread free for smooth 60fps rendering
 */

import { useCallback, useEffect, useRef } from 'react';
import { FinancialIndependenceInputs, OptimizationResult } from '../types';

// Create worker URL using Vite's ?worker import
import FinancialWorker from '../workers/financialCalculator.worker?worker';

interface UseOptimizationWorkerReturn {
    runOptimization: (
        inputs: FinancialIndependenceInputs,
        baselineFiAge: number | null
    ) => Promise<OptimizationResult>;
}

export const useOptimizationWorker = (): UseOptimizationWorkerReturn => {
    const workerRef = useRef<Worker | null>(null);
    const requestIdRef = useRef(0);
    const pendingRef = useRef<Map<number, {
        resolve: (result: OptimizationResult) => void;
        reject: (error: Error) => void;
    }>>(new Map());

    // Initialize worker on mount
    useEffect(() => {
        workerRef.current = new FinancialWorker();

        workerRef.current.onmessage = (e: MessageEvent) => {
            const { type, result, error, requestId } = e.data;
            const pending = pendingRef.current.get(requestId);

            if (!pending) return;

            pendingRef.current.delete(requestId);

            if (type === 'OPTIMIZATION_RESULT') {
                pending.resolve(result);
            } else if (type === 'OPTIMIZATION_ERROR') {
                pending.reject(new Error(error));
            }
        };

        workerRef.current.onerror = (error) => {
            console.error('Worker error:', error);
            // Reject all pending requests
            pendingRef.current.forEach((pending) => {
                pending.reject(new Error('Worker error'));
            });
            pendingRef.current.clear();
        };

        return () => {
            workerRef.current?.terminate();
            workerRef.current = null;
            pendingRef.current.clear();
        };
    }, []);

    const runOptimization = useCallback((
        inputs: FinancialIndependenceInputs,
        baselineFiAge: number | null
    ): Promise<OptimizationResult> => {
        return new Promise((resolve, reject) => {
            if (!workerRef.current) {
                reject(new Error('Worker not initialized'));
                return;
            }

            const requestId = ++requestIdRef.current;
            pendingRef.current.set(requestId, { resolve, reject });

            workerRef.current.postMessage({
                type: 'RUN_OPTIMIZATION',
                payload: { inputs, baselineFiAge },
                requestId
            });
        });
    }, []);

    return { runOptimization };
};
