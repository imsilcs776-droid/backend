export const errorResponse = <Message = any, Meta = any>(message: Message, meta?: Meta) => {
    return {
        success: false,
        message: message,
        meta: meta,
        data: null,
      };
}