export type DBUser = {
    id: number;
    type: string;
    name: string;
    password: string;
    tokenRozklad: string | null;
    tokenCabinet: string | null;
};
