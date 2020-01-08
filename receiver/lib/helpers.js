var helpers = {};
helpers.fileExtensionType = function(filetype){
  if(filetype == 'image/jpeg'){
    return '.jpg';
  } else if(filetype == 'text/plain'){
    return '.txt';
  } else {
    return '.dat';
  }
};
module.exports = helpers;
