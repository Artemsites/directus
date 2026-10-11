import { defineLayout } from '@directus/extensions-sdk';
import LayoutComponent from './layout.vue';

export default defineLayout({
	id: 'calendar-colored',
	name: 'Colored Calendar',
	icon: 'calendar_month',
	component: LayoutComponent,
	slots: {
		options: () => null,
		sidebar: () => null,
		actions: () => null,
	},
	setup() {
		return {};
	},
});
