export const successResponse = <Data = any, Message = any, Meta = any>(data: Data, message: Message, meta?: Meta) => {
  return {
    success: true,
    message: message,
    meta: meta,
    data: data,
  };
}