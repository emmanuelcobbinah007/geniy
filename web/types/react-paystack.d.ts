declare module 'react-paystack' {
    export function usePaystackPayment(config: any): (onSuccess: any, onClose?: any) => void;
    export const PaystackButton: any;
}
