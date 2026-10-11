<template>
	<div class="colored-calendar-layout">
		<!-- Calendar header: date navigation and view switch -->
		<div class="calendar-header">
			<div class="header-left">
				<button class="nav-btn" @click="prevPeriod" title="Previous period">‹</button>
				<button class="today-btn" @click="goToToday">Today</button>
				<button class="nav-btn" @click="nextPeriod" title="Next period">›</button>
				<h2 class="current-period-title">{{ currentPeriodTitle }}</h2>
			</div>

			<div class="header-right">
				<div class="view-switch">
					<button
						:class="['switch-btn', { active: currentView === 'month' }]"
						@click="currentView = 'month'"
					>
						Month
					</button>
					<button
						:class="['switch-btn', { active: currentView === 'week' }]"
						@click="currentView = 'week'"
					>
						Week
					</button>
				</div>
				<button class="refresh-btn" @click="fetchItems" :disabled="loading" title="Refresh tasks">
					<span :class="['refresh-icon', { spinning: loading }]">↻</span>
				</button>
			</div>
		</div>

		<!-- Loading state -->
		<div v-if="loading && items.length === 0" class="loading-state">
			Loading calendar...
		</div>

		<!-- Calendar grid container -->
		<div v-else class="calendar-grid-container">
			<!-- Weekday headers row -->
			<div class="weekdays-row">
				<div v-for="day in weekDayNames" :key="day" class="weekday-header">
					{{ day }}
				</div>
			</div>

			<!-- Grid cells -->
			<div class="calendar-grid">
				<div
					v-for="cell in calendarCells"
					:key="cell.dateKey"
					:class="[
						'calendar-cell',
						{
							'other-month': !cell.isCurrentMonth,
							'is-today': cell.isToday,
						},
					]"
				>
					<div class="cell-header">
						<span class="cell-day-number">{{ cell.dayNumber }}</span>
					</div>

					<div class="cell-events">
						<div
							v-for="item in cell.events"
							:key="item.id"
							class="event-pill"
							:style="getEventStyle(item)"
							:title="getEventTooltip(item)"
							@click="openItem(item)"
						>
							<span class="event-title">{{ item.Title || item.name || `Task #${item.id}` }}</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useApi } from '@directus/extensions-sdk';

const NAMED_DARK_COLORS = new Set(['red', 'blue', 'green', 'black', 'purple', 'brown', 'navy', 'darkblue']);
const NAMED_LIGHT_COLORS = new Set(['yellow', 'white', 'orange', 'cyan', 'lime', 'pink']);

interface TaskItem {
	id: string | number;
	Title?: string;
	name?: string;
	Start?: string | number | null;
	End?: string | number | null;
	highlight_color?: string | null;
	Color?: string | null;
	color?: string | null;
	Status?: string | null;
	[key: string]: any;
}

interface CalendarCell {
	date: Date;
	dateKey: string;
	dayNumber: number;
	isCurrentMonth: boolean;
	isToday: boolean;
	events: TaskItem[];
}

export default defineComponent({
	name: 'ColoredCalendarLayout',
	props: {
		collection: {
			type: String,
			required: true,
		},
	},
	setup(props) {
		const api = useApi();
		const router = useRouter();
		const items = ref<TaskItem[]>([]);
		const loading = ref(false);
		const currentDate = ref(new Date());
		const currentView = ref<'month' | 'week'>('month');

		const weekDayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
		const defaultEventColor = '#2ECDA7'; // Default Directus brand primary color

		// Format date to YYYY-MM-DD in local timezone
		const formatDateKey = (d: Date): string => {
			const year = d.getFullYear();
			const month = String(d.getMonth() + 1).padStart(2, '0');
			const day = String(d.getDate()).padStart(2, '0');
			return `${year}-${month}-${day}`;
		};

		// Safely extract YYYY-MM-DD from ISO string/number respecting local dates and numeric epoch timestamps
		const getItemDateKey = (val: unknown): string | null => {
			if (val === null || val === undefined || val === '') return null;
			const str = String(val).trim();
			// Date-only string (YYYY-MM-DD) avoids UTC day-shift
			if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
				return str;
			}
			// Epoch timestamp (numeric) or ISO string
			const d = typeof val === 'number' || /^\d+$/.test(str)
				? new Date(Number(val))
				: new Date(str);
			if (isNaN(d.getTime())) return null;
			return formatDateKey(d);
		};

		// Load items from current collection with bounding limit and restricted fields
		const fetchItems = async () => {
			if (!props.collection) return;
			loading.value = true;
			try {
				const response = await api.get(`/items/${encodeURIComponent(props.collection)}`, {
					params: {
						limit: 500,
						fields: ['id', 'Title', 'title', 'name', 'Start', 'start', 'End', 'end', 'highlight_color', 'Color', 'color', 'Status', 'status'],
					},
				});
				items.value = response.data?.data || [];
			} catch (err) {
				console.error('Failed to load tasks for calendar:', err);
			} finally {
				loading.value = false;
			}
		};

		onMounted(fetchItems);
		watch(() => props.collection, fetchItems);

		// Current period title with immutable week range calculation
		const currentPeriodTitle = computed(() => {
			const months = [
				'January', 'February', 'March', 'April', 'May', 'June',
				'July', 'August', 'September', 'October', 'November', 'December',
			];
			const d = currentDate.value;
			if (currentView.value === 'month') {
				return `${months[d.getMonth()]} ${d.getFullYear()}`;
			}
			// For week view: compute independent dates without in-place mutation
			const curr = new Date(d);
			const dayOfWeek = (curr.getDay() + 6) % 7;
			const firstDay = new Date(curr.getFullYear(), curr.getMonth(), curr.getDate() - dayOfWeek);
			const lastDay = new Date(firstDay.getFullYear(), firstDay.getMonth(), firstDay.getDate() + 6);
			return `${firstDay.getDate()} ${months[firstDay.getMonth()]} - ${lastDay.getDate()} ${months[lastDay.getMonth()]} ${lastDay.getFullYear()}`;
		});

		// Navigation (with day 1 pinning before month transitions to avoid month-skipping on days 29-31)
		const prevPeriod = () => {
			const d = new Date(currentDate.value);
			if (currentView.value === 'month') {
				d.setDate(1);
				d.setMonth(d.getMonth() - 1);
			} else {
				d.setDate(d.getDate() - 7);
			}
			currentDate.value = d;
		};

		const nextPeriod = () => {
			const d = new Date(currentDate.value);
			if (currentView.value === 'month') {
				d.setDate(1);
				d.setMonth(d.getMonth() + 1);
			} else {
				d.setDate(d.getDate() + 7);
			}
			currentDate.value = d;
		};

		const goToToday = () => {
			currentDate.value = new Date();
		};

		// Calendar cells grid
		const calendarCells = computed<CalendarCell[]>(() => {
			const todayKey = formatDateKey(new Date());
			const cells: CalendarCell[] = [];
			const baseDate = currentDate.value;

			if (currentView.value === 'month') {
				const year = baseDate.getFullYear();
				const month = baseDate.getMonth();

				// First day of current month
				const firstDayOfMonth = new Date(year, month, 1);
				// Day of week index (0=Sun -> 6, 1=Mon -> 0)
				const startDayIndex = (firstDayOfMonth.getDay() + 6) % 7;

				// Previous month days to pad first week
				for (let i = startDayIndex - 1; i >= 0; i--) {
					const prevDate = new Date(year, month, -i);
					const dateKey = formatDateKey(prevDate);
					cells.push({
						date: prevDate,
						dateKey,
						dayNumber: prevDate.getDate(),
						isCurrentMonth: false,
						isToday: dateKey === todayKey,
						events: [],
					});
				}

				// Current month days
				const daysInMonth = new Date(year, month + 1, 0).getDate();
				for (let day = 1; day <= daysInMonth; day++) {
					const date = new Date(year, month, day);
					const dateKey = formatDateKey(date);
					cells.push({
						date,
						dateKey,
						dayNumber: day,
						isCurrentMonth: true,
						isToday: dateKey === todayKey,
						events: [],
					});
				}

				// Next month days to complete remaining cells (multiple of 7)
				const remainingCells = 7 - (cells.length % 7);
				if (remainingCells < 7) {
					for (let day = 1; day <= remainingCells; day++) {
						const nextDate = new Date(year, month + 1, day);
						const dateKey = formatDateKey(nextDate);
						cells.push({
							date: nextDate,
							dateKey,
							dayNumber: day,
							isCurrentMonth: false,
							isToday: dateKey === todayKey,
							events: [],
						});
					}
				}
			} else {
				// Week view (exactly 7 days of current week)
				const curr = new Date(baseDate);
				const firstDayNumber = curr.getDate() - ((curr.getDay() + 6) % 7);
				for (let i = 0; i < 7; i++) {
					const weekDate = new Date(curr.getFullYear(), curr.getMonth(), firstDayNumber + i);
					const dateKey = formatDateKey(weekDate);
					cells.push({
						date: weekDate,
						dateKey,
						dayNumber: weekDate.getDate(),
						isCurrentMonth: weekDate.getMonth() === baseDate.getMonth(),
						isToday: dateKey === todayKey,
						events: [],
					});
				}
			}

			// Precompute item keys once to avoid O(cells * N) date parsing churn
			const mappedTasks = items.value.map((item) => {
				const startKey = getItemDateKey(item.Start);
				const endKey = getItemDateKey(item.End) || startKey;
				return { item, startKey, endKey };
			}).filter((t): t is { item: TaskItem; startKey: string; endKey: string } => !!t.startKey && !!t.endKey);

			// Bind task items to cells across Start / End range
			for (const cell of cells) {
				cell.events = mappedTasks
					.filter((t) => cell.dateKey >= t.startKey && cell.dateKey <= t.endKey)
					.map((t) => t.item);
			}

			return cells;
		});

		// WCAG relative luminance formula for text contrast (supports named colors, 3-, 6-, and 8-digit hex)
		const getContrastTextColor = (hexColor: unknown): string => {
			if (typeof hexColor !== 'string') return '#ffffff';
			const lower = hexColor.toLowerCase().trim();
			if (NAMED_DARK_COLORS.has(lower)) return '#ffffff';
			if (NAMED_LIGHT_COLORS.has(lower)) return '#0f172a';

			if (!lower.startsWith('#')) return '#ffffff';
			let clean = lower.slice(1).trim();
			// Strip alpha channel if 8-digit hex (#RRGGBBAA)
			if (clean.length === 8) {
				clean = clean.slice(0, 6);
			}
			// Expand short #RGB format to #RRGGBB
			if (clean.length === 3) {
				clean = clean.split('').map((c) => c + c).join('');
			}
			if (clean.length !== 6) return '#ffffff';
			const r = parseInt(clean.substring(0, 2), 16) || 0;
			const g = parseInt(clean.substring(2, 4), 16) || 0;
			const b = parseInt(clean.substring(4, 6), 16) || 0;
			// YIQ luminance: 128 threshold splits dark and light tones
			const yiq = (r * 299 + g * 587 + b * 114) / 1000;
			return yiq >= 128 ? '#0f172a' : '#ffffff';
		};

		// Event card pill styling with dynamic background color and computed text contrast
		const getEventStyle = (item: TaskItem) => {
			const bgColor = item.highlight_color || item.Color || item.color || defaultEventColor;
			const textColor = getContrastTextColor(bgColor);
			return {
				backgroundColor: bgColor,
				color: textColor,
			};
		};

		const getEventTooltip = (item: TaskItem): string => {
			const title = item.Title || item.name || `Task #${item.id}`;
			const status = item.Status ? ` [${item.Status}]` : '';
			let timeInfo = '';
			if (item.Start) {
				const str = String(item.Start).trim();
				const d = typeof item.Start === 'number' || /^\d+$/.test(str)
					? new Date(Number(item.Start))
					: new Date(str);
				if (!isNaN(d.getTime())) {
					const hours = String(d.getHours()).padStart(2, '0');
					const mins = String(d.getMinutes()).padStart(2, '0');
					timeInfo = ` (${hours}:${mins})`;
				}
			}
			return `${title}${status}${timeInfo}`;
		};

		// SPA navigation to Directus item edit form with fallback
		const openItem = (item: TaskItem) => {
			if (!item?.id || !props.collection) return;
			const col = encodeURIComponent(String(props.collection));
			const id = encodeURIComponent(String(item.id));
			const path = `/content/${col}/${id}`;
			if (router) {
				router.push(path);
			} else {
				window.location.href = `/admin${path}`;
			}
		};

		return {
			items,
			loading,
			weekDayNames,
			currentView,
			currentPeriodTitle,
			calendarCells,
			prevPeriod,
			nextPeriod,
			goToToday,
			fetchItems,
			getEventStyle,
			getEventTooltip,
			openItem,
		};
	},
});
</script>

<style scoped>
.colored-calendar-layout {
	display: flex;
	flex-direction: column;
	height: 100%;
	padding: 16px 24px;
	box-sizing: border-box;
	background: var(--theme--background, #f1f5f9);
	font-family: inherit;
}

.calendar-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 16px;
	gap: 16px;
}

.header-left,
.header-right {
	display: flex;
	align-items: center;
	gap: 8px;
}

.current-period-title {
	margin: 0 0 0 12px;
	font-size: 1.25rem;
	font-weight: 600;
	color: var(--theme--foreground, #0f172a);
}

.nav-btn,
.today-btn,
.switch-btn,
.refresh-btn {
	background: var(--theme--card--background, #ffffff);
	border: 1px solid var(--theme--border-color, #e2e8f0);
	border-radius: var(--theme--border-radius, 6px);
	padding: 6px 12px;
	font-size: 0.875rem;
	cursor: pointer;
	color: var(--theme--foreground, #0f172a);
	transition: background 0.15s ease, border-color 0.15s ease;
}

.nav-btn:hover,
.today-btn:hover,
.switch-btn:hover,
.refresh-btn:hover {
	background: var(--theme--background-subdued, #f8fafc);
	border-color: var(--theme--primary, #2ecda7);
}

.switch-btn.active {
	background: var(--theme--primary, #2ecda7);
	color: #ffffff;
	border-color: var(--theme--primary, #2ecda7);
	font-weight: 600;
}

.refresh-icon.spinning {
	display: inline-block;
	animation: spin 1s linear infinite;
}

@keyframes spin {
	100% {
		transform: rotate(360deg);
	}
}

.calendar-grid-container {
	display: flex;
	flex-direction: column;
	flex: 1;
	background: var(--theme--card--background, #ffffff);
	border: 1px solid var(--theme--border-color, #e2e8f0);
	border-radius: var(--theme--border-radius, 8px);
	overflow: hidden;
}

.weekdays-row {
	display: grid;
	grid-template-columns: repeat(7, 1fr);
	background: var(--theme--background-subdued, #f8fafc);
	border-bottom: 1px solid var(--theme--border-color, #e2e8f0);
}

.weekday-header {
	padding: 10px;
	text-align: center;
	font-weight: 600;
	font-size: 0.8125rem;
	color: var(--theme--foreground-subdued, #64748b);
	text-transform: uppercase;
}

.calendar-grid {
	display: grid;
	grid-template-columns: repeat(7, 1fr);
	grid-auto-rows: minmax(110px, 1fr);
	flex: 1;
}

.calendar-cell {
	border-right: 1px solid var(--theme--border-color, #e2e8f0);
	border-bottom: 1px solid var(--theme--border-color, #e2e8f0);
	padding: 6px;
	display: flex;
	flex-direction: column;
	overflow: hidden;
	background: var(--theme--card--background, #ffffff);
	transition: background 0.15s ease;
}

.calendar-cell:nth-child(7n) {
	border-right: none;
}

.calendar-cell.other-month {
	background: var(--theme--background-subdued, #f8fafc);
	opacity: 0.65;
}

.calendar-cell.is-today {
	background: rgba(46, 205, 167, 0.08);
}

.cell-header {
	display: flex;
	justify-content: flex-end;
	margin-bottom: 4px;
}

.cell-day-number {
	font-size: 0.8125rem;
	font-weight: 500;
	padding: 2px 6px;
	border-radius: 50%;
	color: var(--theme--foreground-subdued, #475569);
}

.is-today .cell-day-number {
	background: var(--theme--primary, #2ecda7);
	color: #ffffff;
	font-weight: 700;
}

.cell-events {
	display: flex;
	flex-direction: column;
	gap: 4px;
	overflow-y: auto;
}

.event-pill {
	padding: 3px 6px;
	border-radius: 4px;
	font-size: 0.75rem;
	font-weight: 500;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	cursor: pointer;
	box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
	transition: transform 0.1s ease, box-shadow 0.1s ease;
}

.event-pill:hover {
	transform: translateY(-1px);
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
}

.loading-state {
	padding: 40px;
	text-align: center;
	color: var(--theme--foreground-subdued, #64748b);
	font-size: 1rem;
}
</style>
