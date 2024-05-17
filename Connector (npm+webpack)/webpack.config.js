const path = require('path');
const webpack = require('webpack');

module.exports = {
  entry: './src/main.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist')
  },
  mode: 'development',
  devtool: 'source-map',
  module: {
    rules: [
	  // With the following loader, source map is extracted from the SFS2X API library
	  // Build process throws a lot of warnings because the SFS2X API source map doesn't contain the source code;
	  // in order to hide them we use the "stats" entry below
      {
        test: /\.js$/,
        use: ["source-map-loader"],
        enforce: "pre",
      }
    ]
  },
  stats: {
	warningsFilter: /(sfs2x-api)/,
  }
};
