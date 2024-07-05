import mysql from 'mysql2/promise.js';
import autoBind from 'auto-bind';

export class DBManager {
  constructor() {
    this.pool = mysql.createPool({
      connectionLimit: 10,
      host: 'localhost',
      port: 3306,
      user: 'ubb_web_lbim2260',
      password: 'lbim2260',
      database: 'web_lbim2260',
    });
    autoBind(this);
  }

  async getUsernames() {
    const [results] = await this.pool.query('SELECT Username FROM Users');
    const usernames = [];
    results.forEach((r) => {
      usernames.push(r.Username);
    });
    return usernames;
  }

  async insertPicture(restaurantID, fileName) {
    await this.pool.query('INSERT INTO Pictures VALUES (?, ?)', [fileName, restaurantID]);
  }

  async getBasicRestaurants() {
    const [results] = await this.pool.query('SELECT ID, RestaurantName, OpenHour, ClosingHour FROM Restaurants');
    return results;
  }

  async getFilteredBasicRestaurants(args) {
    let townQuery = '';
    args.filter_name = `%${args.filter_name.toLowerCase()}%`;
    if (args.filter_town.length !== 0) {
      args.filter_town = `%${args.filter_town.toLowerCase()}%`;
      townQuery = 'AND Town LIKE ?';
    }
    const [results] = await this.pool.query(
      `SELECT ID, RestaurantName, OpenHour, ClosingHour FROM Restaurants WHERE LOWER(RestaurantName) LIKE ? ${townQuery}`,
      [args.filter_name, args.filter_town],
    );
    return results;
  }

  async getRestaurantFullInfo(ID) {
    const [results] = await this.pool.query('SELECT Town, Street, AddrNum, Phone FROM Restaurants WHERE ID = ?', [ID]);
    return results;
  }

  async getRestaurantByID(ID) {
    const [results] = await this.pool.query('SELECT * FROM Restaurants WHERE ID = ?', [ID]);
    return results[0];
  }

  async getRestaurantReservations(ID) {
    const [results] = await this.pool.query(
      `SELECT ReservationID, ReservationDate, ReservationTime, FirstName, LastName, Confirmed
      FROM Reservations r JOIN Users u ON r.Username = u.Username
      WHERE RestaurantID = ?`,
      [ID],
    );
    return results;
  }

  async getOwnRestaurantReservationIDs(username) {
    const [results] = await this.pool.query(
      `SELECT ReservationID
      FROM Reservations r JOIN Users u ON r.Username = u.Username
      WHERE u.Username = ?`,
      [username],
    );
    const ownReservationIDs = [];
    results.forEach((rObj) => {
      ownReservationIDs.push(rObj.ReservationID);
    });
    return ownReservationIDs;
  }

  async getRestaurantPictures(ID) {
    const [results] = await this.pool.query('SELECT * FROM Pictures WHERE RestaurantID = ?', [ID]);
    results.forEach((r) => {
      r.PicName = `/uploads/${r.PicName}`;
    });
    return results;
  }

  async getPicByName(name) {
    const [results] = await this.pool.query(
      'SELECT OwnerName FROM Pictures p JOIN Restaurants r ON p.RestaurantID = r.ID WHERE p.PicName = ?',
      [name],
    );
    if (results.length === 0) return null;
    return results;
  }

  async deletePicByName(name) {
    await this.pool.query('DELETE FROM Pictures p WHERE p.PicName = ?', [name]);
  }

  async createUser(args, hashedPassword) {
    await this.pool.query('INSERT INTO Users(Username, FirstName, LastName, HashedPassword) VALUES (?, ?, ?, ?)', [
      args.username,
      args.firstname,
      args.lastname,
      hashedPassword,
    ]);
  }

  async createReservation(args) {
    await this.pool.query(
      'INSERT INTO Reservations(Username, RestaurantID, ReservationDate, ReservationTime) VALUES (?, ?, ?, ?)',
      [args.username, args.id, args.res_date, args.res_time],
    );
    const [newID] = await this.pool.query(
      'SELECT MAX(ReservationID) AS NewID FROM Reservations WHERE Username = ? AND RestaurantID = ? AND ReservationDate = ? AND ReservationTime = ?',
      [args.username, args.id, args.res_date, args.res_time],
    );
    return newID[0].NewID;
  }

  async createRestaurant(args) {
    await this.pool.query('INSERT INTO Restaurants VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [
      args.id,
      args.name,
      args.town,
      args.street,
      args.nr,
      args.phone,
      args.open_hour,
      args.closing_hour,
      args.username,
    ]);
  }

  async deleteReservation(args) {
    try {
      const [result] = await this.pool.query('DELETE FROM Reservations WHERE ReservationID = ?', [args.id]);

      if (result.affectedRows === 0) {
        throw new Error();
      }
    } catch (e) {
      throw new Error('Incorrect reservation delete command!');
    }
  }

  async approveReservation(args) {
    try {
      const [result] = await this.pool.query('UPDATE Reservations SET Confirmed = 1 WHERE ReservationID = ?', [
        args.id,
      ]);

      if (result.affectedRows === 0) {
        throw new Error();
      }
    } catch (e) {
      throw new Error('Incorrect reservation approval!');
    }
  }

  async deletePast(args) {
    try {
      const dateObj = new Date(); // today
      let month = dateObj.getMonth() + 1;
      let day = dateObj.getDate();
      const year = dateObj.getFullYear();
      if (month < 10) {
        month = `0${month}`;
      }
      if (day < 10) {
        day = `0${day}`;
      }
      const dateString = `${year}-${month}-${day}`;

      await this.pool.query('DELETE FROM Reservations WHERE ReservationDate < ? AND RestaurantID = ?', [
        dateString,
        args.restaurantID,
      ]);
    } catch (e) {
      throw new Error('Incorrect reservation delete command!');
    }
  }

  async processAllPics(args, action) {
    try {
      const [result] = await this.pool.query(`${action} FROM Pictures WHERE RestaurantID = ?`, [args.restaurantID]);
      return result;
    } catch {
      return null;
    }
  }

  async getHashedPassword(username) {
    try {
      const [result] = await this.pool.query('SELECT HashedPassword FROM Users WHERE Username = ?', [username]);
      return result[0].HashedPassword;
    } catch {
      return null;
    }
  }

  async checkReservationID(username, id) {
    try {
      const [result] = await this.pool.query(
        'SELECT ReservationID, Username, OwnerName, Confirmed FROM Reservations rsrv JOIN Restaurants rstr ON rsrv.RestaurantID = rstr.ID',
      );
      let exists = false;
      let owned = false;

      await result.forEach((r) => {
        if (r.ReservationID === Number(id)) {
          exists = true;
          if (r.Username === username || (r.OwnerName === username && r.Confirmed === 0)) {
            // owned by user, or pending and accessed by restaurant owner
            owned = true;
          }
        }
      });

      if (exists && owned) return 200; // OK
      if (exists) return 403; // forbiden
      return 400; // bad request
    } catch {
      return 400;
    }
  }

  async checkReservationsRestaurantOwnership(username, id) {
    try {
      const [result] = await this.pool.query(
        'SELECT ReservationID, OwnerName, Confirmed FROM Reservations rsrv JOIN Restaurants rstr ON rsrv.RestaurantID = rstr.ID',
      );
      let exists = false;
      let owned = false;

      await result.forEach((r) => {
        if (r.ReservationID === Number(id)) {
          exists = true;
          if (r.OwnerName === username && r.Confirmed === 0) {
            owned = true;
          }
        }
      });

      if (exists && owned) return 200; // OK
      if (exists) return 403; // forbiden
      return 400; // bad request
    } catch {
      return 400;
    }
  }

  async checkRestaurantOwnership(username, id) {
    try {
      const [result] = await this.pool.query('SELECT ID, OwnerName FROM Restaurants');
      let exists = false;
      let owned = false;

      await result.forEach((r) => {
        if (r.ID === Number(id)) {
          exists = true;
          if (r.OwnerName === username) {
            owned = true;
          }
        }
      });

      if (exists && owned) return 200; // OK
      if (exists) return 403; // forbiden
      return 400; // bad request
    } catch {
      return 400;
    }
  }
}

const dbm = new DBManager();
export default dbm;
