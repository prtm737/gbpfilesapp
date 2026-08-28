const path = require('path')
const fs = require('fs')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')

// Parse .env file manually (no dotenv dependency needed)
function loadEnv() {
  const env = {}
  const envPath = path.resolve(__dirname, '.env')
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n')
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq === -1) continue
      const key = trimmed.slice(0, eq).trim()
      let value = trimmed.slice(eq + 1).trim()
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1)
      }
      env[key] = value
    }
  }
  return env
}

const env = loadEnv()

// Inject VITE_* vars as import.meta.env.* (Vite-compatible) and process.env.*
const defineMap = {}
for (const [key, value] of Object.entries(env)) {
  defineMap[`import.meta.env.${key}`] = JSON.stringify(value)
  defineMap[`process.env.${key}`] = JSON.stringify(value)
}
// Fallbacks so code never crashes when vars are missing
defineMap['import.meta.env'] = JSON.stringify({ ...env })
defineMap['process.env'] = JSON.stringify({ ...env })

// Copy public/ assets (favicon, manifest, sw.js) into dist/
class CopyPublicPlugin {
  apply(compiler) {
    compiler.hooks.emit.tapAsync('CopyPublicPlugin', (compilation, callback) => {
      const publicDir = path.resolve(__dirname, 'public')
      if (!fs.existsSync(publicDir)) return callback()
      const files = fs.readdirSync(publicDir)
      let pending = files.length
      if (pending === 0) return callback()
      for (const file of files) {
        const filePath = path.join(publicDir, file)
        if (fs.statSync(filePath).isFile()) {
          fs.readFile(filePath, (err, data) => {
            if (!err) compilation.assets[file] = { source: () => data, size: () => data.length }
            if (--pending === 0) callback()
          })
        } else if (--pending === 0) callback()
      }
    })
  }
}

module.exports = {
  mode: 'production',
  entry: './src/main.jsx',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.[contenthash].js',
    publicPath: '/',
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', { targets: 'defaults' }],
              ['@babel/preset-react', { runtime: 'automatic' }],
            ],
          },
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  resolve: {
    extensions: ['.js', '.jsx'],
    fallback: { crypto: false },
  },
  plugins: [
    new webpack.DefinePlugin(defineMap),
    new CopyPublicPlugin(),
    new HtmlWebpackPlugin({
      template: './index.build.html',
      favicon: false,
    }),
  ],
}