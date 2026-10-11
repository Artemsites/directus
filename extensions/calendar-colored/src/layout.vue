<template>
	<div class="colored-calendar-layout">
		<!-- Шапка календаря: навигация по датам и переключение вида -->
		<div class="calendar-header">
			<div class="header-left">
				<button class="nav-btn" @click="prevPeriod" title="Предыдущий период">‹</button>
				<button class="today-btn" @click="goToToday">Сегодня</button>
				<button class="nav-btn" @click="nextPeriod" title="Следующий период">›</button>
				<h2 class="current-period-title">{{ currentPeriodTitle }}</h2>
			</div>

			<div class="header-right">
				<div class="view-switch">
					<button
						:class="['switch-btn', { active: currentView === 'month' }]"
						@click="currentView = 'month'"
					>
						Месяц
					</button>
					<button
						:class="['switch-btn', { active: currentView === 'week' }]"
						@click="currentView = 'week'"
					>
						Неделя
					</button>
				</div>
				<button class="refresh-btn" @click="fetchItems" :disabled="loading" title="Обновить задачи">
					<span :class="['refresh-icon', { spinning: loading }]">↻</span>
				</button>
			</div>
		</div>

		<!-- Индикатор загрузки -->
		<div v-if="loading && items.length === 0" class="loading-state">
			Загрузка календаря...
		</div>

		<!-- Сетка календаря -->
		<div v-else class="calendar-grid-container">
			<!-- Заголовки дней недели -->
			<div class="weekdays-row">
				<div v-for="day in weekDayNames" :key="day" class="weekday-header">
					{{ day }}
				</div>
			</div>

			<!-- Дни сетки -->
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
							<span class="event-title">{{ item.Title || item.name || `Задача #${item.id}` }}</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, watch } from 'vue';
import { useApi } from '@directus/extensions-sdk';

interface TaskItem {
	id: string | number;
	Title?: string;
	name?: string;
	Start?: string | null;
	End?: string | null;
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
		const items = ref<TaskItem[]>([]);
		const loading = ref(false);
		const currentDate = ref(new Date());
		const currentView = ref<'month' | 'week'>('month');

		const weekDayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
		const defaultEventColor = '#2ECDA7'; // Фирменный цвет Directus по умолчанию

		// Форматирование даты в YYYY-MM-DD
		const formatDateKey = (d: Date): string => {
			const year = d.getFullYear();
			const month = String(d.getMonth() + 1).padStart(2, '0');
			const day = String(d.getDate()).padStart(2, '0');
			return `${year}-${month}-${day}`;
		};

		// Проверка на "сегодня"
		const isSameDay = (d1: Date, d2: Date): boolean => {
			return (
				d1.getFullYear() === d2.getFullYear() &&
				d1.getMonth() === d2.getMonth() &&
				d1.getDate() === d2.getDate()
			);
		};

		// Загрузка элементов из текущей коллекции
		const fetchItems = async () => {
			if (!props.collection) return;
			loading.value = true;
			try {
				const response = await api.get(`/items/${props.collection}`, {
					params: {
						limit: -1,
						fields: ['id', 'Title', 'name', 'Start', 'End', 'color', 'Status'],
					},
				});
				items.value = response.data?.data || [];
			} catch (err) {
				console.error('Ошибка загрузки задач для календаря:', err);
			} finally {
				loading.value = false;
			}
		};

		onMounted(fetchItems);
		watch(() => props.collection, fetchItems);

		// Заголовок текущего периода
		const currentPeriodTitle = computed(() => {
			const months = [
				'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
				'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
			];
			const d = currentDate.value;
			if (currentView.value === 'month') {
				return `${months[d.getMonth()]} ${d.getFullYear()}`;
			}
			// Для вида недели показываем интервал
			const curr = new Date(d);
			const first = curr.getDate() - ((curr.getDay() + 6) % 7);
			const firstDay = new Date(curr.setDate(first));
			const lastDay = new Date(curr.setDate(first + 6));
			return `${firstDay.getDate()} ${months[firstDay.getMonth()]} - ${lastDay.getDate()} ${months[lastDay.getMonth()]} ${lastDay.getFullYear()}`;
		});

		// Навигация
		const prevPeriod = () => {
			const d = new Date(currentDate.value);
			if (currentView.value === 'month') {
				d.setMonth(d.getMonth() - 1);
			} else {
				d.setDate(d.getDate() - 7);
			}
			currentDate.value = d;
		};

		const nextPeriod = () => {
			const d = new Date(currentDate.value);
			if (currentView.value === 'month') {
				d.setMonth(d.getMonth() + 1);
			} else {
				d.setDate(d.getDate() + 7);
			}
			currentDate.value = d;
		};

		const goToToday = () => {
			currentDate.value = new Date();
		};

		// Сетка дней календаря
		const calendarCells = computed<CalendarCell[]>(() => {
			const today = new Date();
			const cells: CalendarCell[] = [];
			const baseDate = currentDate.value;

			if (currentView.value === 'month') {
				const year = baseDate.getFullYear();
				const month = baseDate.getMonth();

				// Первый день месяца
				const firstDayOfMonth = new Date(year, month, 1);
				// День недели (0=Вс -> 6, 1=Пн -> 0)
				const startDayIndex = (firstDayOfMonth.getDay() + 6) % 7;

				// Дни предыдущего месяца для заполнения первой недели
				for (let i = startDayIndex - 1; i >= 0; i--) {
					const prevDate = new Date(year, month, -i);
					cells.push({
						date: prevDate,
						dateKey: formatDateKey(prevDate),
						dayNumber: prevDate.getDate(),
						isCurrentMonth: false,
						isToday: isSameDay(prevDate, today),
						events: [],
					});
				}

				// Дни текущего месяца
				const daysInMonth = new Date(year, month + 1, 0).getDate();
				for (let day = 1; day <= daysInMonth; day++) {
					const date = new Date(year, month, day);
					cells.push({
						date,
						dateKey: formatDateKey(date),
						dayNumber: day,
						isCurrentMonth: true,
						isToday: isSameDay(date, today),
						events: [],
					});
				}

				// Дни следующего месяца для завершения сетки (кратно 7)
				const remainingCells = 7 - (cells.length % 7);
				if (remainingCells < 7) {
					for (let day = 1; day <= remainingCells; day++) {
						const nextDate = new Date(year, month + 1, day);
						cells.push({
							date: nextDate,
							dateKey: formatDateKey(nextDate),
							dayNumber: day,
							isCurrentMonth: false,
							isToday: isSameDay(nextDate, today),
							events: [],
						});
					}
				}
			} else {
				// Вид недели (ровно 7 дней текущей недели)
				const curr = new Date(baseDate);
				const firstDayNumber = curr.getDate() - ((curr.getDay() + 6) % 7);
				for (let i = 0; i < 7; i++) {
					const weekDate = new Date(curr.getFullYear(), curr.getMonth(), firstDayNumber + i);
					cells.push({
						date: weekDate,
						dateKey: formatDateKey(weekDate),
						dayNumber: weekDate.getDate(),
						isCurrentMonth: weekDate.getMonth() === baseDate.getMonth(),
						isToday: isSameDay(weekDate, today),
						events: [],
					});
				}
			}

			// Привязка задач к ячейкам календаря по полям Start / End
			for (const cell of cells) {
				cell.events = items.value.filter((item) => {
					if (!item.Start) return false;
					const itemDateKey = item.Start.slice(0, 10);
					return itemDateKey === cell.dateKey;
				});
			}

			return cells;
		});

		// WCAG-формула относительной яркости для контрастного текста
		const getContrastTextColor = (hexColor: string | null | undefined): string => {
			if (!hexColor || !hexColor.startsWith('#')) return '#ffffff';
			const clean = hexColor.replace('#', '');
			const r = parseInt(clean.substring(0, 2), 16) || 0;
			const g = parseInt(clean.substring(2, 4), 16) || 0;
			const b = parseInt(clean.substring(4, 6), 16) || 0;
			// Яркость YIQ: пороговое значение 128 делит темные и светлые оттенки
			const yiq = (r * 299 + g * 587 + b * 114) / 1000;
			return yiq >= 128 ? '#0f172a' : '#ffffff';
		};

		// Стиль плашки события с фоновым цветом и контрастным текстом
		const getEventStyle = (item: TaskItem) => {
			const bgColor = item.color || defaultEventColor;
			const textColor = getContrastTextColor(bgColor);
			return {
				backgroundColor: bgColor,
				color: textColor,
			};
		};

		const getEventTooltip = (item: TaskItem): string => {
			const title = item.Title || item.name || `Задача #${item.id}`;
			const status = item.Status ? ` [${item.Status}]` : '';
			const start = item.Start ? ` (${item.Start.slice(11, 16) || item.Start.slice(0, 10)})` : '';
			return `${title}${status}${start}`;
		};

		// Переход к форме редактирования элемента в Directus
		const openItem = (item: TaskItem) => {
			const targetUrl = `/admin/content/${props.collection}/${item.id}`;
			window.location.href = targetUrl;
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
