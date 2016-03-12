/*
Navicat MySQL Data Transfer

Source Server         : localhost
Source Server Version : 50540
Source Host           : localhost:3306
Source Database       : onlinekefu

Target Server Type    : MYSQL
Target Server Version : 50540
File Encoding         : 65001

Date: 2016-03-12 14:23:47
*/

SET FOREIGN_KEY_CHECKS=0;

-- ----------------------------
-- Table structure for `kl_kefu`
-- ----------------------------
DROP TABLE IF EXISTS `kl_kefu`;
CREATE TABLE `kl_kefu` (
  `kefu_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `pid` int(11) NOT NULL DEFAULT '0',
  `name` varchar(255) DEFAULT NULL,
  `username` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `room_id` varchar(255) NOT NULL,
  PRIMARY KEY (`kefu_id`)
) ENGINE=MyISAM AUTO_INCREMENT=3 DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of kl_kefu
-- ----------------------------
INSERT INTO `kl_kefu` VALUES ('1', '0', '客服丹丹', 'admin', 'adminrootkl', '666666');
INSERT INTO `kl_kefu` VALUES ('2', '0', '客服丽丽', 'keli', 'adminrootkl', '666666');
