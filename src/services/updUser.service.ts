import * as path from 'path';
import * as fs from 'fs';
import { DataBase } from '../utils/DataBase/DataBase';

export async function updData(
    name: string,
    tokenCabinet?: string | null,
    tokenRozklad?: string | null,
) {
    const dataBase = new DataBase();
    return dataBase.updateData(name, tokenCabinet, tokenRozklad);
}
