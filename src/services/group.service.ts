import { fetchRozklad }  from "../utils/fetchRozklad";

export async function fetchGroup(id: number) {
    return fetchRozklad(id)
}