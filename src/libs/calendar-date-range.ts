const DEFAULT_TIME_ZONE = 'UTC';

export interface CalendarDateRange {
	from: Date;
	to: Date;
}

interface LocalDateParts {
	year: number;
	month: number;
	day: number;
	hour: number;
	minute: number;
	second: number;
}

interface CalendarDateRangeParams {
	from?: string;
	to?: string;
	now: Date;
	timeZone?: string;
}

type CalendarPeriod = 'd' | 'w' | 'm';

interface CalendarEndpoint {
	period: CalendarPeriod;
	periodOffset: number;
	hour: number;
	minute: number;
}

const ENDPOINT_REGEX =
	/^cal\.(d|w|m)\.(now|prev(?:_\d+)?)(?:@([01]\d|2[0-3]):([0-5]\d))?$/;

function getTimeZone(timeZone?: string) {
	try {
		new Intl.DateTimeFormat('en-US', { timeZone }).format(new Date());
		return timeZone || DEFAULT_TIME_ZONE;
	} catch {
		return DEFAULT_TIME_ZONE;
	}
}

function getLocalParts(date: Date, timeZone: string): LocalDateParts {
	const formatter = new Intl.DateTimeFormat('en-US', {
		timeZone,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
		hourCycle: 'h23',
	});
	const parts = Object.fromEntries(
		formatter.formatToParts(date).map(part => [part.type, part.value]),
	);
	return {
		year: Number(parts.year),
		month: Number(parts.month),
		day: Number(parts.day),
		hour: Number(parts.hour),
		minute: Number(parts.minute),
		second: Number(parts.second),
	};
}

function getTimeZoneOffset(date: Date, timeZone: string) {
	const parts = getLocalParts(date, timeZone);
	const localAsUtc = Date.UTC(
		parts.year,
		parts.month - 1,
		parts.day,
		parts.hour,
		parts.minute,
		parts.second,
	);
	return localAsUtc - date.getTime();
}

function localDateToUtc(params: {
	year: number;
	month: number;
	day: number;
	hour?: number;
	minute?: number;
	timeZone: string;
}) {
	const localAsUtc = Date.UTC(
		params.year,
		params.month - 1,
		params.day,
		params.hour ?? 0,
		params.minute ?? 0,
	);
	let utcMs =
		localAsUtc - getTimeZoneOffset(new Date(localAsUtc), params.timeZone);
	utcMs = localAsUtc - getTimeZoneOffset(new Date(utcMs), params.timeZone);
	return new Date(utcMs);
}

function addLocalDays(
	date: Pick<LocalDateParts, 'year' | 'month' | 'day'>,
	days: number,
) {
	const utcDate = new Date(Date.UTC(date.year, date.month - 1, date.day));
	utcDate.setUTCDate(utcDate.getUTCDate() + days);
	return {
		year: utcDate.getUTCFullYear(),
		month: utcDate.getUTCMonth() + 1,
		day: utcDate.getUTCDate(),
	};
}

function getWeekStartOffset(
	date: Pick<LocalDateParts, 'year' | 'month' | 'day'>,
	weekStartsOn: 0 | 1,
) {
	const dayOfWeek = new Date(
		Date.UTC(date.year, date.month - 1, date.day),
	).getUTCDay();
	return (dayOfWeek - weekStartsOn + 7) % 7;
}

function addLocalMonths(
	date: Pick<LocalDateParts, 'year' | 'month' | 'day'>,
	months: number,
) {
	const utcDate = new Date(Date.UTC(date.year, date.month - 1, 1));
	utcDate.setUTCMonth(utcDate.getUTCMonth() + months);
	return {
		year: utcDate.getUTCFullYear(),
		month: utcDate.getUTCMonth() + 1,
		day: 1,
	};
}

function getPeriodOffset(anchor: string) {
	if (anchor === 'now') {
		return 0;
	}
	if (anchor === 'prev') {
		return -1;
	}

	const [, value] = anchor.match(/^prev_(\d+)$/) ?? [];
	return -Number(value);
}

function getPeriodStart(
	endpoint: CalendarEndpoint,
	today: Pick<LocalDateParts, 'year' | 'month' | 'day'>,
) {
	if (endpoint.period === 'd') {
		return addLocalDays(today, endpoint.periodOffset);
	}
	if (endpoint.period === 'm') {
		const currentMonth = { year: today.year, month: today.month, day: 1 };
		return addLocalMonths(currentMonth, endpoint.periodOffset);
	}

	const currentWeekStart = addLocalDays(today, -getWeekStartOffset(today, 1));
	return addLocalDays(currentWeekStart, endpoint.periodOffset * 7);
}

function getBoundaryDate(
	endpoint: CalendarEndpoint,
	today: Pick<LocalDateParts, 'year' | 'month' | 'day'>,
) {
	const localDate = getPeriodStart(endpoint, today);
	return {
		...localDate,
		hour: endpoint.hour,
		minute: endpoint.minute,
	};
}

function getEndpointDate(
	endpoint: CalendarEndpoint,
	now: Date,
	timeZone: string,
) {
	const today = getLocalParts(now, timeZone);
	const boundaryDate = getBoundaryDate(endpoint, today);
	return localDateToUtc({ ...boundaryDate, timeZone });
}

function parseCalendarEndpoint(value?: string): CalendarEndpoint | undefined {
	const match = value?.match(ENDPOINT_REGEX);
	if (!match) {
		return undefined;
	}

	const [, period, anchor, hour, minute] = match;

	return {
		period: period as CalendarPeriod,
		periodOffset: getPeriodOffset(anchor),
		hour: Number(hour ?? 0),
		minute: Number(minute ?? 0),
	};
}

export function resolveCalendarDateRange({
	from,
	to,
	now,
	timeZone,
}: CalendarDateRangeParams): CalendarDateRange | undefined {
	const fromEndpoint = parseCalendarEndpoint(from);
	const toEndpoint = parseCalendarEndpoint(to);
	if (!fromEndpoint || !toEndpoint) {
		return undefined;
	}

	const resolvedTimeZone = getTimeZone(timeZone);
	const resolvedFrom = getEndpointDate(fromEndpoint, now, resolvedTimeZone);
	const resolvedTo = getEndpointDate(toEndpoint, now, resolvedTimeZone);
	return { from: resolvedFrom, to: new Date(resolvedTo.getTime() - 1) };
}
