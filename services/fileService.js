const fs = require('fs')
const File = require('../models/File')
const config = require('config')

class FileService {

    // createDir(file) {
    createDir(req, file) {
        // const filePath = `${config.get('filePath')}\\${file.user}\\${file.path}`
        const filePath = this.getPath(req, file);

        return new Promise(((resolve, reject) => {
            try {
                if (!fs.existsSync(filePath)) {
                    fs.mkdirSync(
                        filePath,
                        { recursive: true }
                    );

                    return resolve({ message: 'File was created' })
                } else {
                    return reject({ message: "File already exist" })
                }
            } catch (e) {
                // return reject({ message: 'File error' })
                return reject(e.message)
            }
        }))
    }

    // deleteFile(file) {
    deleteFile(req, file) {
        // const path = this.getPath(file)
        const path = this.getPath(req, file)
        if (file.type === 'dir') {
            fs.rmdirSync(path)
        } else {
            fs.unlinkSync(path)
        }
    }

    // getPath( file) {
    getPath(req, file) {
        // return config.get('filePath') + '\\' + file.user + '\\' + file.path
        return req.filePath + '\\' + file.user + '\\' + file.path

    }
}


module.exports = new FileService()
