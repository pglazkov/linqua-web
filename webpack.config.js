const helpers = require('./webpack.helpers');
const path = require('path');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const OptimizeJsPlugin = require('optimize-js-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const DllBundlesPlugin = require('webpack-dll-bundles-plugin').DllBundlesPlugin;
const AddAssetHtmlPlugin = require('add-asset-html-webpack-plugin');

const { NoEmitOnErrorsPlugin, LoaderOptionsPlugin, ProgressPlugin, ContextReplacementPlugin, NormalModuleReplacementPlugin, NamedModulesPlugin } = require('webpack');
const { GlobCopyWebpackPlugin, BaseHrefWebpackPlugin } = require('@angular/cli/plugins/webpack');
const { CommonsChunkPlugin, UglifyJsPlugin } = require('webpack').optimize;
const { AotPlugin } = require('@ngtools/webpack');

const srcPath = './src/client';
const dllPath = helpers.root('dist', 'dll');
const distPath = helpers.root('dist', 'wwwroot');
const nodeModules = helpers.root('node_modules');
const entryPoints = ["inline", "polyfills", "sw-register", "styles", "vendor", "main"];

const stats = {
  assets: true,
  cached: false,
  cachedAssets: false,
  children: false,
  chunks: true,
  chunkModules: false,
  chunkOrigins: false,
  colors: true,
  depth: false,
  entrypoints: false,
  errors: true,
  errorDetails: true,
  hash: false,
  maxModules: 0,
  modules: false,
  performance: true,
  providedExports: false,
  publicPath: false,
  reasons: true,
  source: false,
  timings: true,
  usedExports: true,
  version: true,
  warnings: true
};

module.exports = function (args = {}) {
  let isDev = !args.prod;
  let isAot = args.aot;  
  let analyze = args.analyze;

  console.log(`WEBPACK ENV: ${JSON.stringify(args)}`);  

  return {
    target: 'web',
    devtool: isDev ? 'cheap-module-source-map' : undefined,
    stats: stats,
    entry: {
      'main': helpers.root(srcPath, 'main.ts'),
      'polyfills': helpers.root(srcPath, 'polyfills.ts'),
      'styles': helpers.root(srcPath, 'styles.scss')
    },
    output: {
      path: distPath,
      filename: '[name].bundle.js',
      chunkFilename: '[name].[chunkhash].chunk.js',
    },
    resolve: {
      extensions: ['.ts', '.js', '.json'],
      modules: [helpers.root(srcPath), nodeModules]
    },
    module: {
      rules: [
        {
          enforce: 'pre',
          test: /\.ts$/,
          use: 'tslint-loader',
          exclude: [
            nodeModules,
            helpers.root('src', 'client', '$$_gendir') // Exluce AOT temporary directory from TSLint (it fails when type checking is enabled)
          ],
        },
        {
          enforce: 'pre',
          test: /\.js$/,
          loader: 'source-map-loader',
          exclude: [
            nodeModules
          ]
        },
        {
          test: /\.ts$/,
          use: '@ngtools/webpack'
        },
        {
          exclude: [
            helpers.root(srcPath, 'styles.scss')
          ],
          test: /\.css$/,
          use: [
            'exports-loader?module.exports.toString()',
            'css-loader?{"importLoaders":1}',
            'postcss-loader'
          ]
        },
        {
          exclude: [
            helpers.root(srcPath, 'styles.scss')
          ],
          test: /\.scss$|\.sass$/,
          use: [
            'exports-loader?module.exports.toString()',
            'css-loader?{"importLoaders":1}',
            'postcss-loader',
            'sass-loader'
          ]
        },
        {
          include: [
            helpers.root(srcPath, 'styles.scss')
          ],
          test: /\.css$/,
          use: ExtractTextPlugin.extract({
            use: [
              'css-loader?{"importLoaders":1}',
              'postcss-loader'
            ],
            fallback: 'style-loader',
            publicPath: ''
          })
        },
        {
          include: [
            helpers.root(srcPath, 'styles.scss')
          ],
          test: /\.scss$|\.sass$/,
          use: ExtractTextPlugin.extract({
            use: [
              'css-loader?{"importLoaders":1}',
              'postcss-loader',
              'sass-loader'
            ],
            fallback: 'style-loader',
            publicPath: ''
          })
        },
        {
          test: /\.html$/,
          use: 'raw-loader'
        },
        {
          test: /\.(jpg|png|gif)$/,
          use: 'file-loader'
        },

        {
          test: /\.json$/,
          use: 'json-loader'
        },
        {
          test: /\.(eot|svg)$/,
          use: 'file-loader?name=[name].[hash:20].[ext]'
        },
        {
          test: /\.(jpg|png|gif|otf|ttf|woff|woff2|cur|ani)$/,
          use: 'url-loader?name=[name].[hash:20].[ext]&limit=10000'
        }
      ]
    },
    plugins: (() => {
      var plugins = [
        new CleanWebpackPlugin([distPath], {
          verbose: false
        }),

        new NoEmitOnErrorsPlugin(),
        new GlobCopyWebpackPlugin({
          patterns: [
            'assets',
            'favicon.ico'
          ],
          globOptions: {
            cwd: helpers.root(srcPath),
            dot: true,
            ignore: '**/.gitkeep'
          }
        }),
        new ProgressPlugin(),

        new HtmlWebpackPlugin({
          template: helpers.root(srcPath, 'index.html'),
          filename: './index.html',
          hash: false,
          inject: true,
          compile: true,
          favicon: false,
          minify: false,
          cache: true,
          showErrors: true,
          chunks: 'all',
          excludeChunks: [],
          title: 'Webpack App',
          xhtml: true,
          chunksSortMode: function sort(left, right) {
            let leftIndex = entryPoints.indexOf(left.names[0]);
            let rightindex = entryPoints.indexOf(right.names[0]);
            if (leftIndex > rightindex) {
              return 1;
            }
            else if (leftIndex < rightindex) {
              return -1;
            }
            else {
              return 0;
            }
          }
        }),
        new BaseHrefWebpackPlugin({}),
        new CommonsChunkPlugin({
          name: 'inline',
          minChunks: null
        }),
        new CommonsChunkPlugin({
          name: 'vendor',
          minChunks: (module) => module.resource && module.resource.startsWith(nodeModules),
          chunks: [
            'main'
          ]
        }),
        new ExtractTextPlugin({
          filename: '[name].bundle.css',
          disable: isDev
        }),

        new LoaderOptionsPlugin({
          debug: isDev,
          minimize: !isDev,
          sourceMap: isDev,
          options: {
            sassLoader: {
              sourceMap: isDev,
              includePaths: []
            },
            tslint: {
              typeCheck: true,    
              tsConfigFile: helpers.root(srcPath, 'tsconfig.app.json'),
            },
            context: ''
          }
        }),

        new AotPlugin({
          mainPath: 'main.ts',
          exclude: [],
          tsConfigPath: helpers.root(srcPath, 'tsconfig.app.json'),
          skipCodeGeneration: !isAot
        }),

        // Provides context to Angular's use of System.import. See: https://github.com/angular/angular/issues/11580
        new ContextReplacementPlugin(
          /angular(\\|\/)core(\\|\/)@angular/,
          helpers.root(srcPath),
          {
            // your Angular Async Route paths relative to this root directory
          }
        )
      ];

      if (isDev) {
        let dllConfig = require('./webpack.dev.dll.js');

        plugins = plugins.concat([
          new DllBundlesPlugin({
            bundles: dllConfig.bundles,
            dllDir: dllPath,
            webpackConfig: dllConfig.webpackConfig
          }),

          new AddAssetHtmlPlugin([
            { filepath: path.join(dllPath, DllBundlesPlugin.resolveFile('polyfills')) },
            { filepath: path.join(dllPath, DllBundlesPlugin.resolveFile('vendor')) }
          ]),

          new NamedModulesPlugin()
        ]);
      }

      if (!isDev) {
        plugins = plugins.concat([
          new NormalModuleReplacementPlugin(
            /environment\.ts/,
            'environment.prod.ts'
          ),

          new OptimizeJsPlugin({
            sourceMap: false
          }),

          // Description: Minimize all JavaScript output of chunks.
          // Loaders are switched into minimizing mode.
          // NOTE: To debug prod builds uncomment //debug lines and comment //prod lines
          new UglifyJsPlugin({
            // beautify: true, //debug
            // mangle: false, //debug
            // dead_code: false, //debug
            // unused: false, //debug
            // deadCode: false, //debug
            // compress: {
            //   screw_ie8: true,
            //   keep_fnames: true,
            //   drop_debugger: false,
            //   dead_code: false,
            //   unused: false
            // }, // debug
            // comments: true, //debug


            beautify: false, //prod
            output: {
              comments: false
            }, //prod
            mangle: {
              screw_ie8: true
            }, //prod
            compress: {
              screw_ie8: true,
              warnings: false,
              conditionals: true,
              unused: true,
              comparisons: true,
              sequences: true,
              dead_code: true,
              evaluate: true,
              if_return: true,
              join_vars: true,
              negate_iife: false // we need this for lazy v8
            },
          })
        ]);
      }

      if (analyze) {
        plugins = plugins.concat([
          new BundleAnalyzerPlugin()
        ]);
      }

      return plugins;
    })(),

    node: {
      fs: 'empty',
      global: true,
      crypto: 'empty',
      tls: 'empty',
      net: 'empty',
      process: true,
      module: false,
      clearImmediate: false,
      setImmediate: false
    },

    performance: {
      hints: false
    },

    devServer: {
      port: 4200,
      historyApiFallback: true,
      stats: stats
    }
  };
};
