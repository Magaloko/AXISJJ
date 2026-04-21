import { Config } from '@remotion/cli/config'

Config.setVideoImageFormat('jpeg')
Config.setConcurrency(null)
Config.setCodec('h264')
Config.setCrf(18)
Config.setPixelFormat('yuv420p')
Config.setEnforceAudioTrack(false)
