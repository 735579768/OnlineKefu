/*
Navicat MySQL Data Transfer

Source Server         : localhost
Source Server Version : 50540
Source Host           : localhost:3306
Source Database       : onlinekefu

Target Server Type    : MYSQL
Target Server Version : 50540
File Encoding         : 65001

Date: 2016-03-09 17:13:01
*/

SET FOREIGN_KEY_CHECKS=0;

-- ----------------------------
-- Table structure for `kl_kefu`
-- ----------------------------
DROP TABLE IF EXISTS `kl_kefu`;
CREATE TABLE `kl_kefu` (
  `kefu_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `username` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `room_id` varchar(255) NOT NULL,
  PRIMARY KEY (`kefu_id`)
) ENGINE=MyISAM AUTO_INCREMENT=3 DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of kl_kefu
-- ----------------------------
INSERT INTO `kl_kefu` VALUES ('1', '客服丹丹', 'admin', 'adminrootkl', 'asdfasdfasdfasdfasdf');
INSERT INTO `kl_kefu` VALUES ('2', '客服丽丽', 'keli', 'adminrootkl', 'asdfasdfasdfasdfasdf');
