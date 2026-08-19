import {BinaryLike, createHash} from "crypto";

/** md5 hash */
export const md5 = (data: BinaryLike) => createHash("md5").update(data).digest().toString('hex');

/** sha1 hash */
export const sha1 = (data: BinaryLike) => createHash("sha1").update(data).digest().toString('hex');

/** 官方分片上传用：文件前 10002432 字节（约 9.54MB）的 MD5 */
export const MD5_10M_SIZE = 10_002_432

export const md5_10m = (data: Buffer) => md5(data.subarray(0, Math.min(data.length, MD5_10M_SIZE)));
