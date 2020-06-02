const path = require('path');
const config = require('./package.json');
const Terser = require('terser-webpack-plugin');

const webpack = require('webpack');
require('dotenv').config();

const PROD = process.env.NODE_ENV === 'production';

let plugins = [];

module.exports = {
    entry: path.resolve(__dirname, config.main),
    devtool: 'source-map',
    output: {
	library: process.env.NAME,
	libraryTarget: process.env.TARGET,
	path: __dirname,
	filename: (PROD) ? 'build/facedetect.min.js' : 'build/facedetect.js'
    },
    module: {
	rules: [
	    {
		test: /\.js?$/,
		exclude: /node_modules/,
		loader: 'babel-loader'
	    }
	]
    },
    optimization: {
	minimizer: [
	    new Terser()
	]
    },
    mode: PROD ? 'production' : 'development',
    plugins: []
}
