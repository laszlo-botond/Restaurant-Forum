DROP DATABASE IF EXISTS web_lbim2260;

CREATE DATABASE IF NOT EXISTS web_lbim2260;

USE web_lbim2260;

CREATE USER IF NOT EXISTS 'ubb_web_lbim2260'@'%' IDENTIFIED BY 'lbim2260';
GRANT ALL PRIVILEGES ON web_lbim2260.* TO 'ubb_web_lbim2260'@'%';

CREATE TABLE IF NOT EXISTS Users (
    Username VARCHAR(50) PRIMARY KEY,
    FirstName VARCHAR(50),
    LastName VARCHAR(50),
    HashedPassword VARCHAR(100)
);
INSERT INTO Users VALUES 
    ("lbim2260", "Botond", "László", "$2b$10$Nhz28M99oxQBvE1IKwE03uGU.U35es8BAdob/HnYOhe/UEVFhDnSm"), -- password: ubb
    ("realuser00", "Real", "User", "$2b$10$SkvxTmhHa4WlOh2S83kOsOA32u8Hvz.vdcpUOMqlYxArpcfuGz2.6"), -- password: realpassword00
    ("ilikecookies", "Big", "Guy", "$2b$10$UfM00b5vUqi/NPaBSoRQOOQrrgWIYITfACX2Zq9IBp3Wv.I6M8oa2"); -- password: cookie

CREATE TABLE IF NOT EXISTS Restaurants (
    ID INT PRIMARY KEY,
    RestaurantName VARCHAR(50) UNIQUE,
    Town VARCHAR(50),
    Street VARCHAR(50),
    AddrNum VARCHAR(50),
    Phone VARCHAR(50),
    OpenHour VARCHAR(5),
    ClosingHour VARCHAR(5),
    OwnerName VARCHAR(50),
    FOREIGN KEY (OwnerName) REFERENCES Users(Username)
);
INSERT INTO Restaurants VALUES (12341, "epic restaurant", "town", "street", "1", "+40000000", "08:00", "20:00", "lbim2260");

CREATE TABLE IF NOT EXISTS Pictures (
    PicName VARCHAR(100),
    RestaurantID INT,
    FOREIGN KEY (RestaurantID) REFERENCES Restaurants(ID)
);
INSERT INTO Pictures VALUES ("test.jpg", 12341);

CREATE TABLE IF NOT EXISTS Reservations (
    ReservationID INT PRIMARY KEY AUTO_INCREMENT,
    Username VARCHAR(50) NOT NULL,
    RestaurantID INT NOT NULL,
    ReservationDate VARCHAR(50),
    ReservationTime VARCHAR(50),
    Confirmed INT DEFAULT 0,
    FOREIGN KEY (RestaurantID) REFERENCES Restaurants(ID),
    FOREIGN KEY (Username) REFERENCES Users(Username)
);
INSERT INTO Reservations(Username, RestaurantID, ReservationDate, ReservationTime, Confirmed) VALUES 
    ("realuser00", 12341, "2034-05-22", "15:44", 1),
    ("lbim2260", 12341, "2034-05-14", "16:00", 1),
    ("realuser00", 12341, "2020-01-01", "13:00", 0),
    ("ilikecookies", 12341, "2020-01-02", "13:00", 0);

SHOW TABLES;
SELECT * FROM Restaurants;
SELECT * FROM Users;
SELECT * FROM Pictures;
SELECT * FROM Reservations;

