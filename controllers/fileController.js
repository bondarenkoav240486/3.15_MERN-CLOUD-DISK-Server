const fileService = require('../services/fileService')
const config = require('config')
const fs = require('fs')
const User = require('../models/User')
const File = require('../models/File')
const Uuid = require('uuid')

const path = require('path');


// const mv = require('mv');

// Визначення кореневої директорії проекту
// const rootDir = path.resolve(__dirname, '..', '..');
const rootDir = path.resolve(__dirname, '..');

// Відносний шлях до папки files
const staticDir = path.join(rootDir, 'static');

console.log(1122222, staticDir)



class FileController {
    async createDir(req, res) {
        try {
            const { name, type, parent } = req.body
            const file = new File({ name, type, parent, user: req.user.id })
            const parentFile = await File.findOne({ _id: parent })
            if (!parentFile) {
                file.path = name
                // await fileService.createDir(file)
                await fileService.createDir(req, file)
            } else {
                file.path = `${parentFile.path}\\${file.name}`
                // await fileService.createDir(file)
                await fileService.createDir(req, file)
                parentFile.childs.push(file._id)
                await parentFile.save()
            }
            await file.save()
            return res.json(file)
        } catch (e) {
            console.log(e)
            return res.status(400).json(e)
        }
    }

    async getFiles(req, res) {
        try {
            const { sort } = req.query
            let files
            switch (sort) {
                case 'name':
                    files = await File.find({ user: req.user.id, parent: req.query.parent }).sort({ name: 1 })
                    break
                case 'type':
                    files = await File.find({ user: req.user.id, parent: req.query.parent }).sort({ type: 1 })
                    break
                case 'date':
                    files = await File.find({ user: req.user.id, parent: req.query.parent }).sort({ date: 1 })
                    break
                default:
                    files = await File.find({ user: req.user.id, parent: req.query.parent })
                    break;
            }
            return res.json(files)
        } catch (e) {
            console.log(e)
            return res.status(500).json({ message: "Can not get files" })
        }
    }

    async uploadFile(req, res) {
        try {
            const file = req.files.file

            const parent = await File.findOne({ user: req.user.id, _id: req.body.parent })
            const user = await User.findOne({ _id: req.user.id })

            if (user.usedSpace + file.size > user.diskSpace) {
                return res.status(400).json({ message: 'There no space on the disk' })
            }

            user.usedSpace = user.usedSpace + file.size

            let path;
            if (parent) {
                // path = `${config.get('filePath')}\\${user._id}\\${parent.path}\\${file.name}`
                path = `${req.filePath}\\${user._id}\\${parent.path}\\${file.name}`
            } else {
                // path = `${config.get('filePath')}\\${user._id}\\${file.name}`
                path = `${req.filePath}\\${user._id}\\${file.name}`
            }

            if (fs.existsSync(path)) {
                return res.status(400).json({ message: 'File already exist' })
            }
            file.mv(path)
            // fs.rename('',path, ()=>{})

            const type = file.name.split('.').pop()
            let filePath = file.name
            if (parent) {
                filePath = parent.path + "\\" + file.name
            }
            const dbFile = new File({
                name: file.name,
                type,
                size: file.size,
                path: filePath,
                // parent: parent?._id,
                parent: parent ? parent._id : null,
                user: user._id
            });

            await dbFile.save()
            await user.save()

            res.json(dbFile)
        } catch (e) {
            console.log(e)
            return res.status(500).json({ message: "Upload error" })
        }
    }

    async downloadFile(req, res) {
        try {
            const file = await File.findOne({ _id: req.query.id, user: req.user.id })
            // const path = fileService.getPath( file)
            const path = fileService.getPath(req, file)
            if (fs.existsSync(path)) {
                return res.download(path, file.name)
            }
            return res.status(400).json({ message: "Download error" })
        } catch (e) {
            console.log(e)
            res.status(500).json({ message: "Download error" })
        }
    }

    async deleteFile(req, res) {
        try {
            const file = await File.findOne({ _id: req.query.id, user: req.user.id })
            if (!file) {
                return res.status(400).json({ message: 'file not found' })
            }
            fileService.deleteFile(req, file)
            await file.remove()
            return res.json({ message: 'File was deleted' })
        } catch (e) {
            console.log(e)
            return res.status(400).json({ message: 'Dir is not empty' })
        }
    }

    async searchFile(req, res) {
        try {
            const searchName = req.query.search
            let files = await File.find({ user: req.user.id })
            files = files.filter(file => file.name.includes(searchName))
            return res.json(files)
        } catch (e) {
            console.log(e)
            return res.status(400).json({ message: 'Search error' })
        }
    }

    async uploadAvatar(req, res) {
        try {
            const file = req.files.file
            const user = await User.findById(req.user.id)

            const avatarName = Uuid.v4() + ".jpg"
            const avatarPath = path.join(staticDir, avatarName);  // Відносний шлях до файлу аватара

            await file.mv(avatarPath);

            // console.log(config.get('staticPath') + "\\" + avatarName)

            // await file.mv(config.get('staticPath') + "\\" + avatarName)

            user.avatar = avatarName
            await user.save()
            return res.json(user)
        } catch (e) {
            console.log(e)
            return res.status(400).json({ message: 'Upload avatar error' })
        }
    }

    async deleteAvatar(req, res) {
        try {
            const user = await User.findById(req.user.id)
            fs.unlinkSync(config.get('staticPath') + "\\" + user.avatar)
            user.avatar = null
            await user.save()
            return res.json(user)
        } catch (e) {
            console.log(e)
            return res.status(400).json({ message: 'Delete avatar error' })
        }
    }

    async getCurrentDirPath(req, res) {
        try {
            const { parent } = req.query;  // Отримання параметра parent
            if (parent === 'null' || parent === null) {  // Перевірка, чи параметр є 'null' або null
                return res.json({ path: '/' });  // Повернення кореневої адреси
            }
            // if (!parent || parent === 'undefined') {  // Перевірка на undefined або null
            if (parent === 'undefined') {  // Перевірка на undefined або null
                return res.json({ path: '/' });  // Повернення кореневої директорії
            }

            if (!parent) {
                return res.status(400).json({ message: "Parent ID is required" });
            }

            const parentFile = await File.findById(parent);
            if (!parentFile) {
                return res.status(404).json({ message: "Directory not found" });
            }

            return res.json({ path: parentFile.path });
        } catch (e) {
            console.log(e);
            return res.status(500).json({ message: "Error fetching directory path" });
        }
    }

}

module.exports = new FileController()
