(function($){

  'use strict'
  
  var dataFiles = { length: 0 };
  var storeIdFiles = []

  // constanta file,,,, don't edit!!!!!
  var CONST = {
    classDelete: 'remove-file',
    hasDelete: [], // store id, file yang didelete
    fileProcess: 0,
    hasPendingFiles: 0 // store total file yang akan diupload
  }

  $.fn.montaseUpload = function(options) {
    var settings = $.extend({}, $.fn.montaseUpload.defaults, options);
    settings = $.extend(settings, options);
    settings = $.extend(settings, this.data());
    
    wrapInputFile(this, settings)

    this.change(function() {
      var files = this.files
      if ( !settings.multiple ) { 
        updatePlaceholder(this, settings)
      }

      if( settings.upload ) {
        for(var i = 0; i < files.length; i++) {
          uploadFile(this, settings, i)
        }
      }
    });

    if(settings.startUploadSelector) {
      $(document).on('click', settings.startUploadSelector, function(){
        var files = dataFiles

        for(var i = 0; i < files.length; i++) {
          if(!inArray(CONST.hasDelete, i)) {
            startUpload(dataFiles[i], settings, i)
          } 
        }
        if(files.length === 0) {
          sendData(settings)
        }
      }.bind(this))
    }

    return {
      startUpload: function() {
        var files = dataFiles

        for(var i = 0; i < files.length; i++) {
          if(!inArray(CONST.hasDelete, i)) {
            startUpload(dataFiles[i], settings, i)
          } 
        }
        if(files.length === 0) {
          sendData(settings)
        }
      },
      getData: function() {
        return _getData()
      },
      deleteFile: function(id) {
        return _deleteDataFile(id)
      }
    }

  };

  $.fn.montaseUpload.defaults = {
    btnText: 'Choose File',
    placeholder: 'No file Selected',
    author: 'thofikwr@gmail.com',
    upload: false,
    maxSize: false,
    startUploadSelector: "", // selector 
    url: "",
    token: "",
    data: "",
    multiple: false,
    customProgressBar: false,
    setCustomProgressBar: function() {},
    onChange: function() {},
    onSuccess: function() {},
    onFailed: function() {},
    onProgress: function() {}
  };

  function _getData() {
    return dataFiles
  }

  function checkBeforeUpload() {
    var files = dataFiles

    for(var i = 0; i < files.length; i++) {
      if(!inArray(CONST.hasDelete, i)) {
        startUpload(dataFiles[i], settings, i)
      } 
    }
    if(files.length === 0) {
      sendData(settings)
    }
  }

  function wrapInputFile(input, settings) {
    var $parent = $('<div class="montase-upload"></div>')
    var $btn    = $('<button type="button" class="montase-upload__btn">' + settings.btnText + '</button>');
    var $placeholder = $('<span class="montase-upload__file-name">'+ settings.placeholder + '</span>')
    var $inputFile = $(input)

    // create dom
    $inputFile.wrap($parent).before($btn).before($placeholder)
  }

  function updatePlaceholder(input, settings) {
    var $parent         = $(input).parent()
    var $placeholder    = $parent.find('.montase-upload__file-name')
    var inputValue      = $(input).val().replace("C:\\fakepath\\", "")
    var file            = {}

    if(inputValue !== '' && inputValue !== null) $placeholder.text(inputValue)
    file.fileName = inputValue
    settings.onChange(input, file)
  }

  function uploadFile(input, settings, i) {
    var files   = input.files
    var idFile  = setAttrId()
    var $parent = $(input).parent()
    var $target = $('.target-progress-bar')
    var $tr     = $('<tr></tr>')
    var $td     = $('<td></td>')
    var $td2    = $('<td>Just Now, me </td>')
    var $progressBar = $('<td>'+ files[i].name +'<div class="progress-bar"><span class="progress-bar__active"></span><span class="progress-bar__text"></span></div></td>')
    var $btnStartUpload = $(settings.startUploadSelector)
    var $delete = '<a href="#" id="'+setIdFile()+'" style="color: #26C6AC;" class="'+CONST.classDelete+'">DELETE</a>'
  
    if(files.length === 0 ) return   

    // add progress bar
    if(!settings.customProgressBar) {
      $target.find('tbody').prepend($tr)
      $target.find('tbody tr').eq(0)
        .append($progressBar)
        .append($td2)
        .append($td)

      if(!isPdf(files[i])) return 
      if(isSizeLarger(files[i])) return

      $target.find('tbody tr').eq(0).attr('id', idFile)
      $target.find('tbody tr').eq(0)
                              .find('td')
                              .eq(2)
                              .append($delete)
      updateIdFile(idFile)
    }
    else {
      settings.setCustomProgressBar({ 
        target: $target,
        file: files,
        index: i,
        isPdf: isPdf(files[i]),
        isSizeLarger: isSizeLarger(files[i])
      })
    }

    updateDataFile(files[i])

    if($btnStartUpload.prop('disabled')) {
      $btnStartUpload.prop('disabled',  false)
    }

    function isPdf(file) {
      if(file.type !== "application/pdf") {
        var message = 'File must PDF.'
        toErrorText(message)
        return false
      } 
      return true
    }

    function isSizeLarger(file) {
      if(settings.maxSize) {
        var maxSize = settings.maxSize
        var message = 'Maximum file size is 5MB.'

        if(file.size > maxSize) {
          toErrorText(message)
          return true
        } 
        return false
      }
    }

    function toErrorText(message) {
      $target.find('tbody tr')
              .eq(0)
              .find('td')
              .eq(0)
              .append('<span class="montase-upload__error">'+message+'</span>')

      $target.find('tbody tr')
              .eq(0)
              .find('.progress-bar__text')
              .text('Error')

      $target.find('tbody tr')
              .eq(0)
              .find('.progress-bar__active')
              .css({
                backgroundColor: "#ff0030",
                width: '100%'
              })
    }
    
  }

  function startUpload(input, settings, i) {
    var files   = dataFiles
    var $parent = $(input).parent()
    var $target = $('.target-progress-bar')
    // setter
    CONST.hasPendingFiles = parseInt(files.length) - parseInt(CONST.hasDelete.length)
    
    $target.find('#'+storeIdFiles[i])
            .find('.progress-bar__text')
            .text('Uploading')

    var xhr = new XMLHttpRequest();
    var currentEl = $target.find('tbody tr').eq(i);
    
    xhr.upload.addEventListener("progress", function(e) {
      if (e.lengthComputable) {
        var percentage = Math.round((e.loaded * 100) / e.total);
        var $progress = $target.find('#'+storeIdFiles[i]).find('.progress-bar__active')
        $progress.css('width', percentage + '%')

        settings.onProgress()
      }
    }, false);

    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {

          CONST.fileProcess++
          if(CONST.fileProcess === CONST.hasPendingFiles) settings.onSuccess(xhr, currentEl)
  
        } 
        else {
          CONST.fileProcess++
          settings.onFailed(xhr, currentEl)
        }
      } 
    }

    xhr.open("POST", settings.url);
    xhr.overrideMimeType('text/plain; charset=x-user-defined-binary');
    xhr.setRequestHeader('X-CSRF-Token', settings.token);

    var formDataToUpload = new FormData();
    formDataToUpload.append("file[]", files[i]);
    var newFormDataToUpload = updateFormData(formDataToUpload, settings.data)
    xhr.send(newFormDataToUpload);
  }

  function updateDataFile(obj) {
    var length = 1;
    for (var key in dataFiles) {
      if (dataFiles.hasOwnProperty(key) && key !== 'length') length++;
    }
    dataFiles['length'] = length
    return dataFiles[length - 1] = obj
  }

  function updateIdFile(id){
    storeIdFiles.push(id)
    return storeIdFiles
  }

  function removeArrByVal(arr) {
    var what, a = arguments, L = a.length, ax;
    while (L > 1 && arr.length) {
        what = a[--L];
        while ((ax= arr.indexOf(what)) !== -1) {
            arr.splice(ax, 1);
        }
    }
    return arr;
  }

  function setAttrId() {
    var length = storeIdFiles.length; 
    return 'id_' + length
  }

  function setIdFile() {
    return storeIdFiles.length
  }

  function updateFormData(objFormData, data) {
    for (var key in data) {
        if (data.hasOwnProperty(key)) {
          objFormData.append(key, data[key]);
        }
    }
    return objFormData
  }

  function sendData(settings) {
    var xhr = new XMLHttpRequest();

    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          settings.onSuccess(xhr, settings.data)
        } 
        else {
          settings.onFailed(xhr, settings.data)
        }
      } 
    }

    xhr.open("POST", settings.url);
    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhr.setRequestHeader('X-CSRF-Token', settings.token);

    var dataEncoded = $.param(settings.data);
    xhr.send(dataEncoded);
  }

  function _deleteDataFile(id) {
    CONST.hasDelete.push(parseInt(id))
    $('#id_' + id).remove()
    return 
  }

  function inArray(arr, val) {
    var bool = false;
    for( var i = 0; i < arr.length; i++ ) {
      if(arr[i] === val) {
        bool = true;
        break;
      }
    }
    return bool;
  }

})(jQuery);