// function handleEvent() {
//     alert('Hello');
//     const email = document.getElementById("email").value;
//     const password = document.getElementById("password").value;
//     const confirmPassword = document.getElementById("confirmPassword").value;
//     console.log(email, password, confirmPassword);
// }
// alert('Hello');
// const crypto = window.crypto;

// function getDataEncoding(data) {
//     console.log('data :'+data);
//     var encodedData=new Array();
//     const enc = new TextEncoder();
//     data.forEach(element => {
//         encodedData.push(enc.encode(element));
//     });
//     return encodedData;
// }
// async function getCryptoKey(passwordInBytes) {
//     return await crypto.subtle.importKey(
//         "raw",
//         passwordInBytes,
//         "PBKDF2",
//         false,
//         // to derive key
//         ["deriveKey"]
//     );
// }
// async function getAesKey(passwordKey, salt) {
//     return await crypto.subtle.deriveKey(
//         {
//             name:"PBKDF2",
//             salt,
//             iterations: 250000,
//             hash: {name: 'SHA-256'}
//             // which type of key you want to generate {name:'AES-GCM', length: 256}
//         }, passwordKey, {name:'AES-GCM', length: 256}, false, ['encrypt']
//     );
// }
// // var u8_2 = new Uint8Array(atob(b64encoded).split("").map(function(c) {
//     // return c.charCodeAt(0); }));
// function base64encode(binary) {
//     return window.btoa(String.fromCharCode.apply(null, binary));
// }   

// async function encrypt(message, password) {
//     encodedData = getDataEncoding([message, password]);
//     var dataInBytes = encodedData[0];
//     var passwordInBytes = encodedData[1];
//     // get weak password crypto key using importKey function
//     const passwordKey = await getCryptoKey(passwordInBytes);
//     console.log('weak password crypto key :'+passwordKey);
//     // derive an aes key from passwordKye 
//     const salt = crypto.getRandomValues(new Uint8Array(32));
//     const aeskey = await getAesKey(passwordKey, salt);
//     console.log('aes key :'+ aeskey);
//     const iv = crypto.getRandomValues(new Uint8Array(12));
//     const encryptedContent = await crypto.subtle.encrypt({
//         name: "AES-GCM",
//         iv}, aeskey, dataInBytes
//     );
//     const encryptedBytes = new Uint8Array(encryptedContent);
//     const ec = salt + iv + encryptedContent;
//     console.log(salt.length);
//     console.log(iv.length);
//     console.log(encryptedContent);
//     console.log(base64encode(salt).length);
//     console.log(base64encode(iv).length);
//     console.log(base64encode(encryptedBytes).length);
//     console.log(base64encode(salt)+base64encode(iv)+base64encode(encryptedBytes));
// }


// const encryptBtn = document.getElementById('encrypt');
// encryptBtn.addEventListener("click", ()=> {
//     const message = document.getElementById('message').value;
//     const password = document.getElementById('password').value;
//     encrypt(message, password);
// });
// const decryptBtn = document.getElementById('decrypt');
// decryptBtn.addEventListener("click", ()=> {
//     const message = document.getElementById('message').value;
//     const password = document.getElementById('password').value;
//     // const encryptedData = "9nSwN86axApBm4cc3fua4PQzL16WD0bJpHEVaN9FcTM=zIQxx+dkOeCujYZR96iwNCWxYQHZDnfoTFhwM600X+YGSCtvUBG/gTiFxGXrAJrx35Z4Wg==";
//     console.log(message, password);
// });


// async function decrypt(encryptedData, password) {
//     const salt =
// }

// let db = null;


async function digestMessage(message) {
  const msgUint8 = new TextEncoder().encode(message);                           // encode as (utf-8) Uint8Array
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);           // hash the message
  const hashArray = Array.from(new Uint8Array(hashBuffer));                     // convert buffer to byte array
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join(''); // convert bytes to hex string
  return hashHex;
}

const myform = document.getElementById('myform');
myform.onsubmit = async function() {
    const password = document.getElementById('password').value;
    const digestHexPassword = await digestMessage(password);
    document.getElementById('password').value = digestHexPassword;
    myform.submit();
};