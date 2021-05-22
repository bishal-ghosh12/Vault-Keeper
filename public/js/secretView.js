function fun() {
    console.log('Hello');
}


function myFunction() {
    var x = document.getElementById("myTopnav");
    if (x.className === "topnav") {
        x.className += " responsive";
    } else {
        x.className = "topnav";
    }
}
function openForm() {
    document.getElementById("container").style.display = "block";
    document.getElementById("addNew").style.display = "none";
    document.getElementById("myform").reset();
}
function closeForm() {
    document.getElementById("container").style.display = "none";
    document.getElementById("addNew").style.display = "block";
}
function closeUpdateForm() {
    document.getElementById("container1").style.display = "none";
    document.getElementById("addNew").style.display = "block";
}

const table = document.getElementById("table");
let rowIndex;

for (let i = 1; i < table.rows.length; i++) {
    table.rows[i].onclick = async function () {
        rowIndex = this.rowIndex;

        const totalEncryptedLogin = this.cells[1].innerHTML;
        const totalEncryptedPassword = this.cells[2].innerHTML;

        const salt = totalEncryptedLogin.substring(0, 44);
        const iv = totalEncryptedLogin.substring(44, 44 + 16);
        const encryptedLogin = totalEncryptedLogin.substring(44 + 16);
        const encryptedPassword = totalEncryptedPassword.substring(44 + 16);

        const uint8salt = new Uint8Array(_base64ToArrayBuffer(salt));
        const uint8iv = new Uint8Array(_base64ToArrayBuffer(iv));
        const uint8login = new Uint8Array(_base64ToArrayBuffer(encryptedLogin));
        const uint8password = new Uint8Array(_base64ToArrayBuffer(encryptedPassword));

        const res = await loadFromIndexedDB("cryptoKey", 1);
        const aeskey = await getAesKey(res[1], uint8salt);

        decryptMessage(aeskey, uint8login, uint8iv)
            .then(res => {
                document.getElementById('updatelogin').value = new TextDecoder("utf-8").decode(new Uint8Array(res));
            })
            .catch(err => {
                console.log('error' + err)
            });
        decryptMessage(aeskey, uint8password, uint8iv)
            .then(res => {
                document.getElementById('updatepassword').value = new TextDecoder("utf-8").decode(new Uint8Array(res));
            })
            .catch(err => {

                console.log('error' + err);
            });

        document.getElementById('updatetitle').value = this.cells[0].innerHTML;
        document.getElementById('updatewebsiteAddress').value = this.cells[3].innerHTML;
        document.getElementById('updateSid').value = this.cells[4].innerHTML;
        document.getElementById('lastModified').value = this.cells[5].innerHTML;
        document.getElementById("container1").style.display = "block";
        document.getElementById("addNew").style.display = "none";
        document.getElementById("container").style.display = "none";
    };
};

async function decryptMessage(key, data, IV) {
    return await window.crypto.subtle.decrypt({
        name: "AES-GCM",
        iv: IV,
    },
        key,
        data
    )
        .then((decrypted) => {
            return decrypted;
        })
        .catch(function (err) {
            console.log('hello');
            console.error(err);
        });
}

function _base64ToArrayBuffer(base) {
    var binary_string = window.atob(base);
    var len = binary_string.length;
    var bytes = new Uint8Array(len);
    for (var i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
}

function loadFromIndexedDB(storeName) {
    return new Promise(
        function (resolve, reject) {
            var dbRequest = indexedDB.open(storeName);

            dbRequest.onerror = function (event) {
                reject(Error("Error text"));
            };

            dbRequest.onupgradeneeded = function (event) {
                event.target.transaction.abort();
                reject(Error('Not found'));
            };

            dbRequest.onsuccess = function (event) {
                var database = event.target.result;
                var transaction = database.transaction(["crypto_key"]);
                var objectStore = transaction.objectStore("crypto_key");
                objectStore.openCursor().onsuccess = function (event) {
                    let cursor = event.target.result;
                    if (cursor) {
                        resolve([cursor.value.cryptoID, cursor.value.cryptoObj]);
                    }
                }
            };
        }
    );
}

async function getAesKey(passwordKey, salt) {
    return await crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt,
            iterations: 250000,
            hash: { name: 'SHA-256' }
        }, passwordKey, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']
    );
}