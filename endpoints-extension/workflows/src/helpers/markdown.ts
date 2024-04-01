export default {
  text: ({ uploader, email, full_name }: any) => `
    Yth. Bapak / Ibu,
    
    Anda mendapatkan permintaan untuk melakukan persetujuan dokumen aplikasi IMS Pelindo yang diajukan oleh:

    nama  : ${full_name} 

    email : ${email} 
  `,
}
