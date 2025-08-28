import winston from 'winston'

// 定义日志级别
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
}

// 定义日志颜色
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
}

// 告诉winston使用这些颜色
winston.addColors(colors)

// 定义日志格式
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
)

// 定义要记录的日志文件
const transports = [
  // 控制台输出
  new winston.transports.Console(),
  
  // 错误日志文件
  new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
  }),
  
  // 所有日志文件
  new winston.transports.File({ filename: 'logs/combined.log' }),
]

// 创建logger
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'warn',
  levels,
  format,
  transports,
})

export default logger