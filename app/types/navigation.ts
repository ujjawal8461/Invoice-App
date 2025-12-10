// app/types/navigation.ts
export type InvoiceItem = {
    id: string;
    serviceId: string;
    serviceName: string;
    ratePaise: number;
    quantity: number;
};

export type InvoiceData = {
    billNo: string;
    date: string;
    customerName: string;
    items: InvoiceItem[];
    totalPaise: number;
};

export type RootStackParamList = {
    Home: undefined;
    NewInvoice: undefined;
    Services: undefined;
    Preview: { invoiceData?: InvoiceData } | undefined;
    Settings: undefined;
};