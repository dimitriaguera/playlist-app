import React, { Component } from 'react'
import config from 'env/config.client'

import style from './style/dropZone.scss'


class DropZone extends Component {

  constructor() {
    super();

    this.onDrop = this.onDrop.bind(this);
    this.onDragLeave = this.onDragLeave.bind(this);
    this.onDragOver = this.onDragOver.bind(this);

    this.state = {
      isHovered: false,
      input: false,
      files: [],
      ignoredFiles: []
    }
  }

  componentWillMount() {

    // We could add this function on window in order to put some visual when
    // a file enter in the window.
    // But to many listener for just that at the moment.
    //window.addEventListener('dragover', (e) => e.preventDefault());
    //window.addEventListener('drop', (e) => e.preventDefault());
  }

  handleUpload() {



  }

  resetDrag(){

  }


  addFile(file){
    return new Promise( (resolve) => {
      if( (config.fileSystem.fileAudioTypes.test(file.name) || config.fileSystem.fileImageTypes.test(file.name)) &&
          file.name.substring(0, 1) !== '.') {

            this.setState(prevState => ({
              files: [...prevState.files, file]
            }));

      } else {
            this.setState(prevState => ({
              ignoredFiles: [...prevState.ignoredFiles, file]
            }));
     }

      resolve(file);
    });
  }

  addFilesFromDirectory(directory, path) {

    // This promise is resolved when all items are resolved
    return new Promise( (resolveOne, rejectOne) => {

      let reader = directory.createReader();
      let promises = [];
      let _self = this;

      (function readEntries() {

          // According to the FileSystem API spec, readEntries() must be called until
          // it calls the callback with an empty array.
          reader.readEntries( (entries) => {

              if (!entries.length) {

                // Done iterating this particular directory
                Promise.all(promises)
                  .then(
                    (files) => {
                      resolveOne(files);
                    }
                  );
              } else {


                for (let entry of entries) {

                  // FILES
                  if (entry.isFile) {
                    promises.push(
                      new Promise( (resolve, reject) => {
                        entry.file(
                          file => {
                            file.fullPath = `${path}/${file.name}`;
                            resolve(_self.addFile(file));
                          },
                          error => reject(error)
                        );
                      })
                    );

                  // DIRECTORIES
                  } else if (entry.isDirectory) {
                    promises.push(_self.addFilesFromDirectory(entry, `${path}/${entry.name}`));
                  }
                }

                // calling readEntries() again for the same dir
                readEntries();

              }
            },

            error => rejectOne(error)

          );

      })();

    });

  }


  // When a folder is dropped items must be handled
  // Copied from Dropzone.js www.dropzonejs.com/
  addFilesFromItems(items){

    // This promise is resolved when all items are resolved
    return new Promise( (resolveOne, rejectOne) => {

      let promises = [];

      for (let item of items) {
        let entry;
        if ((item.webkitGetAsEntry != null) && (entry = item.webkitGetAsEntry())) {
          if (entry.isFile) {
            promises.push(this.addFile(item.getAsFile()));
          } else if (entry.isDirectory) {
            // Append all files from that directory to files
            promises.push(this.addFilesFromDirectory(entry, entry.name));
          }
        } else if (item.getAsFile != null) {
          if ((item.kind == null) || (item.kind === "file")) {
            promises.push(this.addFile(item.getAsFile()));
          }
        }
      }

      Promise
        .all(promises)
        .then ((files) => {

          resolveOne(files);
        })
        .catch((error) => {
          rejectOne(error);
        })
      ;

    })

  }

  addFiles(files) {

    // This promise is resolve when all items are resolved
    return new Promise( (resolveOne, rejectOne) => {

      // Array of promise for all files
      let promises = [];

      for (let file of files) {
        promises.push(this.addFile(file));
      }

      Promise
        .all(promises)
        .then ((files) => {
          resolveOne(files);
        })
        .catch((error) => {
          rejectOne(error);
        })
      ;

    });

  }

  addFilesHandler(e) {

      let {files} = e.dataTransfer;

      // We want to known if is a file or a folder and if the browser support folder.
      if (files.length) {
        let {items} = e.dataTransfer;
        if (items && items.length && (items[0].webkitGetAsEntry != null)) {
          // Browser supports folders
          console.log('start');
          this.addFilesFromItems(items)
            .then(() => {
              this.sendFiles(this.state.files);
            })
            .catch(e => {
              console.log(e);
            });
        } else {
          this.addFiles(files)
            .then((files) => console.log('finished'))
            .catch(e => {
              console.log(e);
            });
        }
      }

  }


  sendFiles(files){

    // Create a new FormData object.
    let formData = new FormData();

    // Loop through each of the selected files.
    for (let i = 0, l = files.length ; i < l ; i++) {
      // Add the file to the request.
      formData.append(`files[${i}]`, files[i], files[i].fullPath || files[i].name);
    }

    // Set up the request.
    let xhr = new window.XMLHttpRequest();

    // Open the connection.
    xhr.open('POST', 'api/sendFiles', true);


    // Set up a handler for when the request finishes.
    xhr.onload = function () {
      if (xhr.status === 200) {
        // File(s) uploaded.
        alert('upload');
      } else {
        alert('An error occurred!');
      }
    };

    // Send the Data.
    xhr.send(formData);

  }


  onDrop(e){
    e.preventDefault();
    e.stopPropagation();

    if (!e.dataTransfer) {
      return;
    }

    this.addFilesHandler(e);



    this.setState({input: true});


    //@todo set input false after cb
  }

  onDragOver(e){
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
    this.setState({isHovered: true});
  }

  onDragLeave(e){
    e.preventDefault();
    e.stopPropagation();

    this.setState({isHovered: false});
  }

  render(){

    const classes = this.state.isHovered ? 'dragOver' : '';


    return(
      <div className={classes} multiple={true} onDrop={this.onDrop} onDragOver={this.onDragOver} onDragLeave={this.onDragLeave}>
        {this.props.children}
        {this.state.input &&
          <form method="post" encType="multipart/form-data">
              <div>
                <label htmlFor="file">Sélectionner le fichier à envoyer</label>
                <input type="file" id="file" name="file" multiple/>
              </div>
          </form>
        }
      </div>
    );


  }

}

export default DropZone