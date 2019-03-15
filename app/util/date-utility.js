const isISODate = require('is-iso-date')

const MILISSEGUNDO = 'milissegundo'
const SECOND = 'segundo'
const MINUTE = 'minuto'
const HOUR = 'hora'
const DAY = 'dia'
const WEEK = 'semana'
const MONTH = 'mes'
const TWO_MONTHS = 'bimestre'
const SEMESTER = 'semestre'
const QUARTER = 'trimestre'
const YEAR = 'ano'

module.exports = exports = {
	PERIODS: {
		MILISSEGUNDO,
		SECOND,
		MINUTE,
		HOUR,
		DAY,
		WEEK,
		MONTH,
		TWO_MONTHS,
		SEMESTER,
		QUARTER,
		YEAR
	},
	dateInApointment(date, target, period, duration) {

		let minimo

		switch (period) {
			case DAY:
				minimo = 1000 * 60 * 60 * 24
				break
			case WEEK:
				minimo = 1000 * 60 * 60 * 24 * 7
				break
			case MONTH:
				minimo = 1000 * 60 * 60 * 24 * 28
				break
			case TWO_MONTHS:
				minimo = 1000 * 60 * 60 * 24 * 28 * 2
				break
			case SEMESTER:
				minimo = 1000 * 60 * 60 * 24 * 28 * 6
				break
			case QUARTER:
				minimo = 1000 * 60 * 60 * 24 * 28 * 3
				break
			case YEAR:
				minimo = 1000 * 60 * 60 * 24 * 365
				break
			default:
				throw { message: `Período ${period} inválido` }
		}

		let passo = minimo * duration
		let timeDate = date.getTime()
		let timeTarget = target.getTime()
		let dif = timeTarget - timeDate
		let add = Math.floor(dif / passo)

		let dateIt = exports.plus(date, period, duration * add)

		if (exports.dateEquals(dateIt, target))
			return true

		while (dateIt.getTime() <= target.getTime()) {
			if (exports.dateEquals(dateIt, target))
				return true
			dateIt = exports.plus(dateIt, period, duration)
		}

		return false
	},
	toDate(str) {
		str = str.trim();
		// Converte "dia/mes/ano <hora, <minuto, <segundo, <milisegundo>>>>"
		// Para [dia, mes, ano <hora, <minuto, <segundo, <milisegundo>>>>]

		let dateArray = str.split(/\/|\s+|:/g)

		// Troca dia por ano
		let tmp = dateArray[0]
		dateArray[0] = dateArray[2]
		dateArray[2] = tmp

		// Decrementa-se o mes
		dateArray[1] = dateArray[1] - 1

		let valid = true

		for (let it of dateArray) {
			it = Number.parseInt(it)
			if (Number.isNaN(it)) {
				valid = false
				break
			}
		}

		// Cria um date
		return valid && new Date(...dateArray)
	},
	scape(str) {
		return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
	},
	dateToStr(valor, pattern = "dd/MM/yyyy") {
		pattern = pattern.trim()
		if (typeof (valor) == 'string' && isISODate(valor))
			valor = new Date(valor);

		if (valor instanceof Date) {
			let dia = `${valor.getDate()}`
			let mes = `${valor.getMonth() + 1}`
			let hora = `${valor.getHours()}`
			let minuto = `${valor.getMinutes()}`
			let segundo = `${valor.getSeconds()}`
			let milissegundo = `${valor.getMilliseconds()}`
			let ano = `${valor.getFullYear()}`

			let values = {
				yyyy: ano,
				yy: ano.substring(ano.length-2, ano.length),
				MM: mes.length == 1 ? `0${mes}` : mes,
				M: mes,
				dd: dia.length == 1 ? `0${dia}` : dia,
				d: dia,
				hh: hora.length == 1 ? `0${hora}` : hora,
				h: hora,
				mm: minuto.length == 1 ? `0${minuto}` : minuto,
				m: minuto,
				ss: segundo.length == 1 ? `0${segundo}` : segundo,
				s: segundo,
				ll: milissegundo.length == 1 ? `0${milissegundo}` : milissegundo,
				l: milissegundo,
				'': ''
			}

			let expPattern = /yyyy|yy|MM|M|dd|d|hh|h|mm|m|ss|s|ll|l/g
			let seps = pattern.split(expPattern)

			let sepsScape = seps.filter(s => s).map(exports.scape)
			let mask = pattern.split(new RegExp(sepsScape.join('|'), 'g')).filter(p => p)

			return seps.reduce((anterior, atual, index) => {
				let m = mask[index]
				if (!m) m = ''
				return `${anterior}${atual}${values[m]}`
			}, '')
		}

		return valor
	},
	plus(date, period, duration) {

		let [dia, mes, ano, hora, minuto, segundo, milissegundo] = [
			date.getDate(),
			date.getMonth(),
			date.getFullYear(),
			date.getHours(),
			date.getMinutes(),
			date.getSeconds(),
			date.getMilliseconds()
		]

		switch (period) {
			case MILISSEGUNDO: return new Date(ano, mes, dia, hora, minuto, segundo, milissegundo + duration)
			case SECOND: return new Date(ano, mes, dia, hora, minuto, segundo + duration, milissegundo)
			case MINUTE: return new Date(ano, mes, dia, hora, minuto + duration, segundo, milissegundo)
			case HOUR: return new Date(ano, mes, dia, hora + duration, minuto, segundo, milissegundo)
			case DAY: return new Date(ano, mes, dia + duration, hora, minuto, segundo, milissegundo)
			case WEEK: return new Date(ano, mes, dia + duration * 7, hora, minuto, segundo, milissegundo)
			case MONTH: return new Date(ano, mes + duration, dia, hora, minuto, segundo, milissegundo)
			case TWO_MONTHS: return new Date(ano, mes + duration * 2, dia, hora, minuto, segundo, milissegundo)
			case SEMESTER: return new Date(ano, mes + duration * 6, dia, hora, minuto, segundo, milissegundo)
			case QUARTER: return new Date(ano, mes + duration * 3, dia, hora, minuto, segundo, milissegundo)
			case YEAR: return new Date(ano + duration, mes, dia, hora, minuto, segundo, milissegundo)
			default:
				throw { message: `Período ${period} inválido` }
		}
	},
	dateEquals(date1, date2, ignore) {
		let values1 = [
			date1.getFullYear(),
			date1.getMonth(),
			date1.getDate(),
			date1.getHours(),
			date1.getMinutes(),
			date1.getSeconds(),
			date1.getMilliseconds()
		]

		let values2 = [
			date2.getFullYear(),
			date2.getMonth(),
			date2.getDate(),
			date2.getHours(),
			date2.getMinutes(),
			date2.getSeconds(),
			date2.getMilliseconds()
		]

		return values1.reduce((anterior, atual, index) => {
			if ((ignore == 0 || ignore) && ignore >= 0 && index >= ignore)
				return anterior
			if (!anterior)
				return false
			if (atual !== values2[index])
				return false
			return true
		}, true)
	},
	getDateIgnore(date, ignore) {
		let values = [
			date.getFullYear(),
			date.getMonth(),
			date.getDate(),
			date.getHours(),
			date.getMinutes(),
			date.getSeconds(),
			date.getMilliseconds()
		]

		let dateArray = values.reduce((anterior, atual, index) => {
			if ((ignore == 0 || ignore) && ignore >= 0 && index >= ignore)
				return [...anterior, 0]
			return [...anterior, atual]
		}, [])

		return new Date(...dateArray)
	},
	getDateDayWeekByDate(dayWeek, date) {
		let diff = dayWeek - date.getDay()
		return exports.plus(date, DAY, diff)
	}
}
