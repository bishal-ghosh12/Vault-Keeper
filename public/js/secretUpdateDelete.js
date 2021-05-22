const myformUpdateDelete = document.getElementById('myformUpdateDelete');
const update = document.getElementById('update');
const del = document.getElementById('delete');
const generatePasword = document.getElementById('generatingPassword');
const generateUpdatePasword = document.getElementById('generatingUpdatePassword');

del.addEventListener('click', () => {
    myformUpdateDelete.action = '/pms/secretDelete';
    myformUpdateDelete.submit();
    return false;
});

update.addEventListener('click', () => {
    myformUpdateDelete.action = '/pms/secretUpdate';
    // myformUpdateDelete.submit();
    // return false;
});

generatePasword.addEventListener('click', () => {
    document.getElementById('password').value = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
});

generateUpdatePassword.addEventListener('click', () => {
    success();
    document.getElementById('updatepassword').value = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
});

function topFunction() {
    document.getElementById('update').style.display = 'none';
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
};

function success() {
    document.getElementById('update').style.display = "inline";
}



