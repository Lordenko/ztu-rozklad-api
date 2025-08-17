import * as path from 'path';
import * as fs from 'fs';
import { DataBase } from '../utils/DataBase/DataBase';

export async function insertData(type: string, name: string, password: string) {
    const dataBase = new DataBase();
    return dataBase.new(type, name, password);
}
