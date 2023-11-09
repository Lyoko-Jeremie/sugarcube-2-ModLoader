// Generated using webpack-cli https://github.com/webpack/webpack-cli

const path = require('path');
// const HtmlWebpackPlugin = require('html-webpack-plugin');

const isProduction = process.env.NODE_ENV == 'production';


// const stylesHandler = 'style-loader';

const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

// const ZipPlugin = require('zip-webpack-plugin');

const config = {
  // https://webpack.js.org/configuration/entry-context/#entry
  entry: {
    BeforeSC2: './src/BeforeSC2/init.ts',
    polyfillWebpack: './src/BeforeSC2/polyfill.ts',
  },
  output: {
    path: path.resolve(__dirname, 'dist-BeforeSC2'),
    filename: '[name].js',
  },
  // https://webpack.js.org/configuration/devtool/
  // devtool: 'inline-source-map',
  // https://webpack.js.org/configuration/target/
  target: 'web',
  // target: 'node',

  // devServer: {
  //   open: true,
  //   host: '0.0.0.0',
  //   port: 3000,
  // },
  plugins: [

    //      INFO: generate a html entry from the template
    // new HtmlWebpackPlugin({
    //   template: 'src/web/1.html',
    // }),

    //      INFO: run Ts Check in parallel, [use special tsconfig]
    new ForkTsCheckerWebpackPlugin({
      typescript: {
        configFile: 'src/BeforeSC2/tsconfig.json',
      }
    }),

    // // https://www.npmjs.com/package/zip-webpack-plugin
    // new ZipPlugin({
    //   // OPTIONAL: defaults to the Webpack output path (above)
    //   // can be relative (to Webpack output path) or absolute
    //   path: 'zip',
    //
    //   // OPTIONAL: defaults to the Webpack output filename (above) or,
    //   // if not present, the basename of the path
    //   filename: 'xxxxxxxxxxxxxxxx.zip',
    //
    //   // OPTIONAL: defaults to including everything
    //   // can be a string, a RegExp, or an array of strings and RegExps
    //   include: [/\.js$/],
    //
    //   // OPTIONAL: defaults to excluding nothing
    //   // can be a string, a RegExp, or an array of strings and RegExps
    //   // if a file matches both include and exclude, exclude takes precedence
    //   exclude: [/\.png$/, /\.html$/],
    // }),

    // Add your plugins here
    // Learn more about plugins from https://webpack.js.org/configuration/plugins/
  ],
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/i,
        loader: 'ts-loader',
        exclude: ['/node_modules/'],
      },
      // {
      //   test: /\.css$/i,
      //   use: [stylesHandler, 'css-loader'],
      // },
      // {
      //   test: /\.s[ac]ss$/i,
      //   use: [stylesHandler, 'css-loader', 'sass-loader'],
      // },
      {
        test: /\.(eot|svg|ttf|woff|woff2|png|jpg|gif)$/i,
        type: 'asset',
      },

      // Add your rules for custom modules here
      // Learn more about loaders from https://webpack.js.org/loaders/
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js', '...'],
    //      INFO: set a special tsconfig if you have multi, otherwise 'ts-loader' will read default from root dir
    plugins: [new TsconfigPathsPlugin({
      configFile: 'src/BeforeSC2/tsconfig.json'
    })],

    //      INFO: set some UMD lib to special js file, can skip webpack importer check
    // alias: {
    //   vue: 'vue/dist/vue.js'
    // },
  },
};


module.exports = () => {
  if (isProduction) {
    config.mode = 'production';

    //      INFO: add some special config or operate to the config
    config.devtool = undefined;

  } else {
    config.mode = 'development';
  }
  return config;
};
