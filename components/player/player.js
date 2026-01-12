import WebAudioFontPlayer from './webaudiofont'

class Player {
  constructor(instruments, master) {
    this.instruments = instruments
    this.master = master
    this.echoAmount = 0.5
    this.initAudio()
  }
  contextTime() {
    return this.audioContext.currentTime
  }
  refreshCache() {
    if (this.instruments) {
      for (var i = 0; i < this.instruments.length; i++) {
        this.cacheInstrument(this.instruments[i])
      }
    }
  }
  initAudio() {
    if (this.player) {
      if (this.audioContext) {
        this.player.cancelQueue(this.audioContext)
      }
    }
    var AudioContextFunc = window.AudioContext || window.webkitAudioContext
    this.audioContext = new AudioContextFunc()
    this.destination = this.audioContext.destination
    this.player = new WebAudioFontPlayer()
    this.equalizer = this.player.createChannel(this.audioContext)
    this.output = this.audioContext.createGain()
    this.echo = this.player.createReverberator(this.audioContext)
    this.echo.wet.gain.setTargetAtTime(this.echoAmount, 0, 0.0001)
    this.echo.output.connect(this.output)
    this.equalizer.output.connect(this.echo.input)
    this.output.connect(this.destination)
    this.volumesInstrument = []
    this.midiNotes = []
    this.instruments.map((instrument) => {
      this.cacheInstrument(instrument)
    })
  }
  resume() {
    this.audioContext.resume()
  }
  cacheInstrument(n) {
    var info = this.player.loader.instrumentInfo(n)
    if (window[info.variable]) {
      return
    }
    this.player.loader.startLoad(this.audioContext, info.url, info.variable)
    this.player.loader.waitLoad(function () {
      console.log('cached', n, info.title)
    })
  }
  startPlay(beats, bpm, density, fromBeat, loop, setIndexCurrentChord, setIsPlaying) {
    this.stopPlay()
    var wholeNoteDuration = (4 * 60) / bpm
    if (fromBeat < beats.length) {
      this.beatIndex = fromBeat
    } else {
      this.beatIndex = 0
    }
    var nextLoopTime = this.contextTime()
    var me = this
    this.loopIntervalID = setInterval(function () {
      if (me.contextTime() > nextLoopTime) {
        if (me.beatIndex >= beats.length) {
          if (!loop) {
            setIndexCurrentChord(-1)
            setIsPlaying(false)
            return
          }
          me.beatIndex = 0
        }
        setIndexCurrentChord(me.beatIndex)
        if (me.beatIndex >= beats.length) {
          me.beatIndex = 0
        }
        me.playBeatAt(nextLoopTime, beats[me.beatIndex], bpm)
        nextLoopTime = nextLoopTime + density * wholeNoteDuration
        me.beatIndex++
      }
    }, 22)
  }
  stopPlay() {
    clearInterval(this.loopIntervalID)
    this.cancelQueue()
  }
  cancelQueue() {
    this.player.cancelQueue(this.audioContext)
  }
  playBeatAt(when, beat, bpm) {
    var chords = beat
    var N = (4 * 60) / bpm
    for (var i = 0; i < chords.length; i++) {
      var chord = chords[i]
      var instrument = chord[0]
      var pitches = chord[1]
      var duration = chord[2]
      this.playStrumDownAt(when, instrument, pitches, duration * N)
    }
  }
  playChordAt(when, instrument, pitches, duration) {
    var info = this.player.loader.instrumentInfo(instrument)
    if (window[info.variable]) {
      this.player.queueChord(this.audioContext, this.equalizer.input, window[info.variable], when, pitches, duration, 1)
    } else {
      this.cacheInstrument(instrument)
    }
  }
  playStrumUpAt(when, instrument, pitches, duration) {
    var info = this.player.loader.instrumentInfo(instrument)
    if (window[info.variable]) {
      this.player.queueStrumUp(
        this.audioContext,
        this.equalizer.input,
        window[info.variable],
        when,
        pitches,
        duration,
        0.1,
      )
    } else {
      this.cacheInstrument(instrument)
    }
  }
  playStrumDownAt(when, instrument, pitches, duration) {
    var info = this.player.loader.instrumentInfo(instrument)
    if (window[info.variable]) {
      this.player.queueStrumDown(
        this.audioContext,
        this.equalizer.input,
        window[info.variable],
        when,
        pitches,
        duration,
        0.1,
      )
    } else {
      this.cacheInstrument(instrument)
    }
  }
  playSnapAt(when, instrument, pitches, duration) {
    var info = this.player.loader.instrumentInfo(instrument)
    if (window[info.variable]) {
      this.player.queueSnap(
        this.audioContext,
        this.equalizer.input,
        window[info.variable],
        when,
        pitches,
        duration,
        0.05,
      )
    } else {
      this.cacheInstrument(instrument)
    }
  }
  playChordNow(instrument, pitches, duration) {
    this.playChordAt(0, instrument, pitches, duration)
  }
  playStrumUpNow(instrument, pitches, duration) {
    this.playStrumUpAt(0, instrument, pitches, duration)
  }
  playStrumDownNow(instrument, pitches, duration) {
    this.th(0, instrument, pitches, duration)
  }
  playSnapNow(instrument, pitches, duration) {
    this.playSnapAt(0, instrument, pitches, duration)
  }
  setMasterVolume(volume) {
    this.volume = volume
  }
  setInstrumentVolume(instrument, volume) {
    this.volumesInstrument[instrument] = volume
  }
}

export default Player
