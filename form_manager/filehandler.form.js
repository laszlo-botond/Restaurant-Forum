import Busboy from 'busboy';
import fs from 'fs';
import dbm from '../db/dbmanager.db.js';

export default class BBfile {
  constructor(req, res) {
    this.req = req;
    this.res = res;
    this.busboy = Busboy({ headers: req.headers });
    this.processedname = '';
    this.restaurantID = '';
  }

  verifyText() {
    this.busboy.on('field', async (fieldname, value) => {
      if (fieldname !== 'id') {
        throw new Error();
      }
      this.restaurantID = value;

      const restaurant = await dbm.getRestaurantByID(this.restaurantID);
      // check if ID exists
      if (typeof restaurant === 'undefined') {
        throw new Error();
      }
    });
  }

  verifyFile() {
    // verify file
    this.busboy.on('file', (fieldname, file, fileinfo) => {
      const date = new Date();
      if (fieldname !== 'restaurant_img') {
        throw new Error();
      }
      this.processedname = `${date.getTime()}${fileinfo.filename}`.replaceAll(' ', '_');
      const saveTo = `./public/uploads/${this.processedname}`;
      console.log(`Uploading ${saveTo}`);
      file.pipe(fs.createWriteStream(saveTo));
    });
  }

  finishUpload() {
    // finish the upload
    this.busboy.on('finish', async () => {
      console.log('Upload complete');
      await dbm.insertPicture(this.restaurantID, this.processedname);

      this.res.redirect(`/restaurant_details?id=${this.restaurantID}`);
    });
  }

  // public method using the private ones
  uploadFile() {
    try {
      this.verifyText();
      this.verifyFile();
      this.finishUpload();
      this.req.pipe(this.busboy);
    } catch {
      throw new Error();
    }
  }
}
