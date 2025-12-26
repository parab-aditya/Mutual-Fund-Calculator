/**
 * Hook for running financial optimization in a Web Worker
 * Keeps the main thread free for smooth 60fps rendering
 */

import { useCallback, useEffect, useRef } from 'react';
import { FinancialIndependenceInputs, OptimizationResult } from '../types';

// Create worker URL using Vite's ?worker import
import FinancialWorker from '../workers/financialCalculator.worker?worker';

// Timeout for worker operations (30 seconds)
const WORKER_TIMEOUT_MS = 30000;

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
        timeoutId: ReturnType<typeof setTimeout>;
    }>>(new Map());

    // Initialize worker on mount
    useEffect(() => {
        try {
            workerRef.current = new FinancialWorker();
        } catch (e) {
            console.error('Failed to create worker:', e);
            workerRef.current = null;
            return;
        }

        workerRef.current.onmessage = (e: MessageEvent) => {
            const { type, result, error, requestId } = e.data;
            const pending = pendingRef.current.get(requestId);

            if (!pending) return;

            // Clear the timeout since we got a response
            clearTimeout(pending.timeoutId);
            pendingRef.current.delete(requestId);

            if (type === 'OPTIMIZATION_RESULT') {
                pending.resolve(result);
            } else if (type === 'OPTIMIZATION_ERROR') {
                pending.reject(new Error(error));
            }
        };

        workerRef.current.onerror = (error) => {
            console.error('Worker error event:', error);
            // Reject all pending requests with proper cleanup
            pendingRef.current.forEach((pending, requestId) => {
                clearTimeout(pending.timeoutId);
                pending.reject(new Error('Worker crashed unexpectedly'));
            });
            pendingRef.current.clear();

            // Try to recreate the worker for future requests
            try {
                workerRef.current?.terminate();
                workerRef.current = new FinancialWorker();
            } catch (e) {
                console.error('Failed to recreate worker:', e);
                workerRef.current = null;
            }
        };

        // Also handle messageerror events
        workerRef.current.onmessageerror = (error) => {
            console.error('Worker message error:', error);
            pendingRef.current.forEach((pending) => {
                clearTimeout(pending.timeoutId);
                pending.reject(new Error('Worker message error'));
            });
            pendingRef.current.clear();
        };

        return () => {
            // Clean up all pending timeouts
            pendingRef.current.forEach((pending) => {
                clearTimeout(pending.timeoutId);
            });
            pendingRef.current.clear();
            workerRef.current?.terminate();
            workerRef.current = null;
        };
    }, []);

    const runOptimization = useCallback((
        inputs: FinancialIndependenceInputs,
        baselineFiAge: number | null
    ): Promise<OptimizationResult> => {
        return new Promise((resolve, reject) => {
            if (!workerRef.current) {
                reject(new Error('Worker not available'));
                return;
            }

            const requestId = ++requestIdRef.current;

            // Set up timeout to prevent indefinite hanging
            const timeoutId = setTimeout(() => {
                const pending = pendingRef.current.get(requestId);
                if (pending) {
                    pendingRef.current.delete(requestId);
                    console.warn(`Worker timeout for request ${requestId}`);
                    reject(new Error('Worker timeout - calculation took too long'));
                }
            }, WORKER_TIMEOUT_MS);

            pendingRef.current.set(requestId, { resolve, reject, timeoutId });

            try {
                workerRef.current.postMessage({
                    type: 'RUN_OPTIMIZATION',
                    payload: { inputs, baselineFiAge },
                    requestId
                });
            } catch (e) {
                // postMessage can fail if worker is in a bad state
                clearTimeout(timeoutId);
                pendingRef.current.delete(requestId);
                reject(new Error('Failed to send message to worker'));
            }
        });
    }, []);

    return { runOptimization };
};
