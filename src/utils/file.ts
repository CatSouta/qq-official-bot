import * as fs from 'fs'
import * as path from 'path'
import axios from 'axios'

export function isHttpUrl(value: string): boolean {
    return /^https?:\/\//i.test(value)
}

export function stripFileProtocol(filepath: string): string {
    return filepath.replace(/^file:\/\//, '')
}

export async function getBase64FromLocal(filepath:string){
    return (await fs.promises.readFile(stripFileProtocol(filepath))).toString('base64')
}
export async function getBase64FromWeb(url:string){
    const res = await axios.get(url,{
        responseType:'arraybuffer'
    })
    return Buffer.from(res.data).toString('base64')
}
export function getFileBase64(file:string|Buffer){
    if(Buffer.isBuffer(file)) return file.toString('base64')
    if(file.startsWith('http')) return getBase64FromWeb(file)
    if(file.startsWith('base64://')) return file.replace('base64://', '')
    try { return getBase64FromLocal(file) } catch {}
    return file
}

export async function getFileBuffer(file: string | Buffer): Promise<{ buffer: Buffer; fileName?: string }> {
    if (Buffer.isBuffer(file)) return { buffer: file }
    if (isHttpUrl(file)) {
        const res = await axios.get(file, {
            responseType: 'arraybuffer',
            timeout: 60_000,
            maxContentLength: 200 * 1024 * 1024,
        })
        return {
            buffer: Buffer.from(res.data),
            fileName: path.basename(new URL(file).pathname) || undefined,
        }
    }
    if (file.startsWith('base64://')) {
        return { buffer: Buffer.from(file.slice(9), 'base64') }
    }
    if (/^data:[^/]+\/[^;]+;base64,/.test(file)) {
        return { buffer: Buffer.from(file.replace(/^data:[^/]+\/[^;]+;base64,/, ''), 'base64') }
    }
    const filePath = stripFileProtocol(file)
    return {
        buffer: await fs.promises.readFile(filePath),
        fileName: path.basename(filePath),
    }
}
