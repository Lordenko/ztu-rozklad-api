import * as path from 'path';
import * as fs from 'fs';
import { User } from '../models/User';

export async function updData(
    name: string,
    tokenCabinet?: string | null,
    tokenRozklad?: string | null,
) {
    return new User().updateData(name, tokenCabinet, tokenRozklad);
}
