function check_user(user) {


plainajax.request('respurl: check_user.php?user=' +  user + '; resultloc: response; ');

}

function add_user(user,name,surname) {
plainajax.request('respurl: add_user.php?user=' +  user + '&name=' + name + '&surname=' + surname +'; resultloc: response; ');

}
