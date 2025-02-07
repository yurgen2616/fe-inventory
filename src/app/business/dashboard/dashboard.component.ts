import { Component, OnInit, HostListener, ViewChild, ElementRef, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { format, subDays, subWeeks, subMonths, endOfDay, startOfDay, parseISO, addDays } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { SaleService } from '../../shared/services/sale.service';
import Chart from 'chart.js/auto';
import { es } from 'date-fns/locale';
import { isPlatformBrowser } from '@angular/common';

interface GroupedData {
  [key: string]: {
    sales: number;
    margin: number;
    date: Date;
  }
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export default class DashboardComponent implements OnInit {
  selectedPeriodIndex: number = 0;
  sliderPosition: number = 0;

  weeklySalesData: any[] = [];

  totalSales: number = 0;
  totalMargin: number = 0;
  numberOfSales: number = 0;

  @ViewChild('salesChart') salesChart!: ElementRef;
  chart: any;
  isLoading: boolean = false;

  selectedView: 'week' | 'month' | '6months' | 'year' = 'week';

  viewOptions = [
    { value: 'week', label: 'Última semana' },
    { value: 'month', label: 'Último mes' },
    { value: '6months', label: 'Último semestre' },
    { value: 'year', label: 'Último año' }
  ];

  periodOptions = [
    { value: 'today', label: 'Hoy' },
    { value: 'yesterday', label: 'Ayer' },
    { value: 'lastWeek', label: 'Última semana' },
    { value: 'last15Days', label: 'Últimos 15 días' },
    { value: 'lastMonth', label: 'Último mes' },
    { value: 'last3Months', label: 'Último trimestre' },
    { value: 'lastYear', label: 'Último año' }
  ];

  private isDragging = false;

  constructor(private saleService: SaleService, @Inject(PLATFORM_ID) private platformId: Object) { }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.fetchDataForView();
    }
  }

  selectPeriodByIndex(index: number) {
    this.selectedPeriodIndex = index;
    this.sliderPosition = (index / (this.periodOptions.length - 1)) * 100;
    this.fetchMetrics();
  }

  startSliderDrag(event: MouseEvent | TouchEvent) {
    event.preventDefault();
    this.isDragging = true;

    if (event.type === 'mousedown') {
      document.addEventListener('mousemove', this.onSliderMove);
      document.addEventListener('mouseup', this.onSliderEnd);
    } else {
      document.addEventListener('touchmove', this.onSliderMove);
      document.addEventListener('touchend', this.onSliderEnd);
    }
  }

  @HostListener('document:mousemove', ['$event'])
  @HostListener('document:touchmove', ['$event'])
  onSliderMove = (event: MouseEvent | TouchEvent) => {
    if (!this.isDragging) return;

    const container = document.querySelector('.bg-gray-300');
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const clientX = event instanceof MouseEvent
      ? event.clientX
      : event.touches[0].clientX;

    const newPosition = ((clientX - containerRect.left) / containerRect.width) * 100;

    this.sliderPosition = Math.max(0, Math.min(100, newPosition));

    this.selectedPeriodIndex = Math.round((this.sliderPosition / 100) * (this.periodOptions.length - 1));
  }

  onSliderEnd = () => {
    this.isDragging = false;

    this.sliderPosition = (this.selectedPeriodIndex / (this.periodOptions.length - 1)) * 100;

    this.fetchMetrics();

    document.removeEventListener('mousemove', this.onSliderMove);
    document.removeEventListener('mouseup', this.onSliderEnd);
    document.removeEventListener('touchmove', this.onSliderMove);
    document.removeEventListener('touchend', this.onSliderEnd);
  }

  fetchMetrics() {
    const selectedPeriod = this.periodOptions[this.selectedPeriodIndex].value;
    const { startDate, endDate } = this.calculateDateRange(selectedPeriod);

    const formattedStart = format(startDate, "yyyy-MM-dd'T'HH:mm:ss");
    const formattedEnd = format(endDate, "yyyy-MM-dd'T'HH:mm:ss");

    this.saleService.searchSalesByDateRange(formattedStart, formattedEnd)
      .subscribe({
        next: (sales) => {
          if (!Array.isArray(sales)) {
            console.error('Sales data is not an array:', sales);
            return;
          }
          this.calculateTotals(sales);
        },
        error: (err) => {
          console.error('Error fetching sales metrics', err);
        }
      });
  }

  calculateDateRange(period: string) {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = endOfDay(now);

    switch (period) {
      case 'today':
        startDate = startOfDay(now);
        break;
      case 'yesterday':
        startDate = startOfDay(subDays(now, 1));
        endDate = endOfDay(subDays(now, 1));
        break;
      case 'lastWeek':
        startDate = startOfDay(subWeeks(now, 1));
        break;
      case 'last15Days':
        startDate = startOfDay(subDays(now, 15));
        break;
      case 'lastMonth':
        startDate = startOfDay(subMonths(now, 1));
        break;
      case 'last3Months':
        startDate = startOfDay(subMonths(now, 3));
        break;
      case 'lastYear':
        startDate = startOfDay(subMonths(now, 12));
        break;
      default:
        startDate = startOfDay(now);
    }

    return { startDate, endDate };
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.initializeChart();
    }
  }

  private updateChartData(startDate: Date, endDate: Date) {
    if (!isPlatformBrowser(this.platformId)) return;
  
    if (!this.chart || !this.weeklySalesData) {
      console.log('No hay chart o datos de ventas');
      return;
    }
  
    // Obtener fecha actual al inicio del día en la zona horaria local
    const now = startOfDay(new Date());
    
    // Crear un objeto con los últimos 7 días
    const last7Days: GroupedData = {};
    
    // Crear el rango de días
    for (let i = 6; i >= 0; i--) {
      const currentDate = subDays(now, i);
      // Usar format directamente con la fecha local
      const dateKey = format(currentDate, 'yyyy-MM-dd');
      
      console.log(`Inicializando día ${i}:`, {
        date: currentDate,
        dateKey
      });
      
      last7Days[dateKey] = {
        sales: 0,
        margin: 0,
        date: currentDate
      };
    }
  
    // Agrupar ventas por día
    this.weeklySalesData.forEach((sale: any) => {
      // Parsear la fecha de la venta considerando que viene como LocalDateTime
      const saleDate = parseISO(sale.createdAt);
      // Ajustar al inicio del día para evitar problemas con horas
      const normalizedSaleDate = startOfDay(saleDate);
      const saleDateKey = format(normalizedSaleDate, 'yyyy-MM-dd');
      
      console.log('Procesando venta:', {
        fechaOriginal: sale.createdAt,
        fechaNormalizada: normalizedSaleDate,
        fechaClave: saleDateKey,
        total: sale.total
      });
      
      if (last7Days[saleDateKey]) {
        console.log(`Agregando venta al día ${saleDateKey}`);
        last7Days[saleDateKey].sales += Number(sale.total) || 0;
  
        const saleMargin = sale.details.reduce((margin: number, detail: any) => {
          const purchasePrice = Number(detail.product?.purchasePrice) || 0;
          const price = Number(detail.price) || 0;
          const quantity = Number(detail.quantity) || 0;
          return margin + ((price - purchasePrice) * quantity);
        }, 0);
  
        last7Days[saleDateKey].margin += saleMargin;
      }
    });
  
    // Ordenar los días cronológicamente
    const orderedDays = Object.entries(last7Days)
      .sort(([dateA], [dateB]) => parseISO(dateA).getTime() - parseISO(dateB).getTime());
  
    console.log('Días ordenados:', orderedDays);
  
    const labels = orderedDays.map(([dateKey]) => {
      const date = parseISO(dateKey);
      return format(date, 'EEEE, d', { locale: es });
    });
    
    const salesData = orderedDays.map(([_, data]) => data.sales);
    const marginData = orderedDays.map(([_, data]) => data.margin);
  
    this.chart.data.labels = labels;
    this.chart.data.datasets[0].data = salesData;
    this.chart.data.datasets[1].data = marginData;
    this.chart.update();
  }
  

  getDateRangeForView(): { startDate: Date, endDate: Date } {
    const now = new Date();
    const endDate = endOfDay(now); // Aseguramos que incluya todo el día actual
    let startDate: Date;

    switch (this.selectedView) {
      case 'month':
        startDate = subMonths(now, 1);
        break;
      case '6months':
        startDate = subMonths(now, 6);
        break;
      case 'year':
        startDate = subMonths(now, 12);
        break;
      default: // week
        startDate = subDays(now, 6);
    }

    return {
      startDate: startOfDay(startDate), // Inicio del primer día
      endDate: endDate // Final del día actual
    };
  }

  fetchDataForView() {
    this.isLoading = true;
    const { startDate, endDate } = this.getDateRangeForView();
  
    // Asegurarnos de que las fechas estén en el formato correcto para el backend
    const formattedStart = format(startOfDay(startDate), "yyyy-MM-dd'T'00:00:00");
    const formattedEnd = format(endOfDay(endDate), "yyyy-MM-dd'T'23:59:59");
  
    console.log('Fetching data with range:', {
      startDate: formattedStart,
      endDate: formattedEnd,
    });
  
    this.saleService.searchSalesByDateRange(formattedStart, formattedEnd)
      .subscribe({
        next: (sales) => {
          this.weeklySalesData = sales;
          console.log('Ventas recibidas:', sales.map(sale => ({
            fecha: sale.createdAt,
            total: sale.total
          })));
          
          this.calculateTotals(sales);
  
          if (this.chart) {
            this.processDataForView();
          }
  
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error fetching sales data:', err);
          this.isLoading = false;
        }
      });
  }

  private initializeChart() {
    if (!this.salesChart?.nativeElement) {
      console.error('Canvas element not found');
      return;
    }

    const ctx = this.salesChart.nativeElement.getContext('2d');
    if (!ctx) {
      console.error('Could not get 2D context');
      return;
    }

    // Plugin personalizado para el crosshair con animación
    const crosshairPlugin = {
      id: 'crosshair',
      beforeDraw: (chart: any) => {
        if (chart.tooltip?._active?.length) {
          const activePoint = chart.tooltip._active[0];
          const { ctx } = chart;
          const { x } = activePoint.element;
          const topY = chart.scales.y.top;
          const bottomY = chart.scales.y.bottom;

          ctx.save();
          ctx.beginPath();
          ctx.moveTo(x, topY);
          ctx.lineTo(x, bottomY);
          ctx.lineWidth = 1;
          ctx.strokeStyle = 'rgba(107, 114, 128, 0.5)';
          ctx.setLineDash([5, 5]);
          ctx.stroke();
          ctx.restore();
        }
      }
    };

    this.chart = new Chart(ctx, {
      type: 'line',
      plugins: [crosshairPlugin],
      data: {
        labels: [],
        datasets: [
          {
            label: 'Ventas',
            data: [],
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4,
            fill: true
          },
          {
            label: 'Ganancias',
            data: [],
            borderColor: 'rgb(16, 185, 129)',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            tension: 0.4,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 750,
          easing: 'easeInOutQuart'
        },
        interaction: {
          intersect: false,
          mode: 'index',
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              usePointStyle: true,
              padding: 20
            }
          },
          tooltip: {
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            titleColor: '#1f2937',
            titleFont: {
              size: 14,
              weight: 'bold'
            },
            bodyColor: '#4b5563',
            bodyFont: {
              size: 13
            },
            borderColor: '#e5e7eb',
            borderWidth: 1,
            padding: 12,
            cornerRadius: 8,
            displayColors: true,
            callbacks: {
              title: (tooltipItems) => {
                if (this.selectedView === 'week') {
                  // Si es una fecha ISO, la parseamos y formateamos
                  try {
                    const date = parseISO(tooltipItems[0].label);
                    return format(date, 'EEEE, d MMMM', { locale: es });
                  } catch {
                    return tooltipItems[0].label;
                  }
                }
                return this.getTooltipTitle(this.selectedView, tooltipItems[0].label);
              },
              label: (context) => {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.parsed.y !== null) {
                  const value = parseFloat(context.parsed.y.toString());
                  label += new Intl.NumberFormat('es-ES', {
                    style: 'currency',
                    currency: 'COP'
                  }).format(value);
                }
                return label;
              },
              afterBody: (tooltipItems) => {
                const ventasValue = tooltipItems[0].parsed.y;
                const margenValue = tooltipItems[1]?.parsed.y;
                if (ventasValue && margenValue) {
                  const porcentajeMargen = (margenValue / ventasValue) * 100;
                  return [`Margen: ${porcentajeMargen.toFixed(2)}%`];
                }
                return [];
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function (value) {
                const numericValue = typeof value === 'string' ? parseFloat(value) : value;
                return new Intl.NumberFormat('es-ES', {
                  style: 'currency',
                  currency: 'COP'
                }).format(numericValue);
              }
            },
            grid: {
              color: 'rgba(107, 114, 128, 0.1)'
            }
          },
          x: {
            grid: {
              display: true,
              color: 'rgba(107, 114, 128, 0.1)'
            },
            ticks: {
              maxRotation: 45,
              minRotation: 45
            }
          }
        },
        hover: {
          mode: 'index',
          intersect: false
        },
        elements: {
          point: {
            radius: 4,
            hoverRadius: 6,
            borderWidth: 2,
            hoverBorderWidth: 3
          },
          line: {
            borderWidth: 3
          }
        }
      }
    });
  }

  onViewChange(view: 'week' | 'month' | '6months' | 'year') {
    this.selectedView = view;
    this.fetchDataForView();
  }

  private getTooltipTitle(view: string, label: string): string {
    switch (view) {
      case 'month':
        return `Semana ${label}`;
      case '6months':
      case 'year':
        return label;
      default:
        return format(new Date(label), 'EEEE, d MMMM', { locale: es });
    }
  }



  fetchSalesData(startDate: Date, endDate: Date) {
    const formattedStart = format(startDate, "yyyy-MM-dd'T'HH:mm:ss");
    const formattedEnd = format(endDate, "yyyy-MM-dd'T'HH:mm:ss");

    this.saleService.searchSalesByDateRange(formattedStart, formattedEnd)
      .subscribe({
        next: (sales) => {
          this.weeklySalesData = sales;
          this.processDataForView();
        },
        error: (err) => {
          console.error('Error fetching sales data:', err);
        }
      });
  }

  processDataForView() {
    // Calcular totales primero
    this.calculateTotals(this.weeklySalesData);

    // Luego procesar datos para la gráfica según la vista
    switch (this.selectedView) {
      case 'month':
        this.processWeeklyData();
        break;
      case '6months':
      case 'year':
        this.processMonthlyData();
        break;
      default:
        this.processDailyData();
    }
  }

  processDailyData() {
    const endDate = new Date();
    const startDate = subDays(endDate, 6);

    // Calcular totales antes de actualizar el gráfico
    this.calculateTotals(this.weeklySalesData);

    // Actualizar el gráfico
    this.updateChartData(startDate, endDate);
  }

  private calculateTotals(sales: any[]) {
    try {
      this.totalSales = sales.reduce((sum, sale) => {
        const total = Number(sale.total) || 0;
        return sum + total;
      }, 0);

      this.totalMargin = sales.reduce((total, sale) => {
        if (!Array.isArray(sale.details)) {
          console.warn('Sale details is not an array:', sale);
          return total;
        }

        const saleMargin = sale.details.reduce((margin: number, detail: any) => {
          const purchasePrice = Number(detail.product?.purchasePrice) || 0;
          const price = Number(detail.price) || 0;
          const quantity = Number(detail.quantity) || 0;
          return margin + ((price - purchasePrice) * quantity);
        }, 0);

        return total + saleMargin;
      }, 0);

      this.numberOfSales = sales.length;
    } catch (error) {
      console.error('Error calculating totals:', error);
      this.totalSales = 0;
      this.totalMargin = 0;
      this.numberOfSales = 0;
    }
  }

  private processWeeklyData() {
    const groupedData: any = {};
    const endDate = new Date();

    this.weeklySalesData.forEach((sale: any) => {
      const saleDate = new Date(sale.createdAt);
      const weekNumber = format(saleDate, 'w');
      const weekKey = `Semana ${weekNumber}`;

      if (!groupedData[weekKey]) {
        groupedData[weekKey] = {
          sales: 0,
          margin: 0
        };
      }

      groupedData[weekKey].sales += Number(sale.total) || 0;
      const saleMargin = this.calculateSaleMargin(sale);
      groupedData[weekKey].margin += saleMargin;
    });

    this.updateChartWithGroupedData(groupedData);
  }

  private processMonthlyData() {
    const groupedData: any = {};

    this.weeklySalesData.forEach((sale: any) => {
      const saleDate = new Date(sale.createdAt);
      const monthKey = format(saleDate, 'MMMM yyyy', { locale: es });

      if (!groupedData[monthKey]) {
        groupedData[monthKey] = {
          sales: 0,
          margin: 0
        };
      }

      groupedData[monthKey].sales += Number(sale.total) || 0;
      const saleMargin = this.calculateSaleMargin(sale);
      groupedData[monthKey].margin += saleMargin;
    });

    this.updateChartWithGroupedData(groupedData);
  }

  private calculateSaleMargin(sale: any): number {
    return sale.details.reduce((margin: number, detail: any) => {
      const purchasePrice = Number(detail.product?.purchasePrice) || 0;
      const price = Number(detail.price) || 0;
      const quantity = Number(detail.quantity) || 0;
      return margin + ((price - purchasePrice) * quantity);
    }, 0);
  }

  private updateChartWithGroupedData(groupedData: any) {
    const labels = Object.keys(groupedData);
    const salesData = labels.map(label => groupedData[label].sales);
    const marginData = labels.map(label => groupedData[label].margin);

    if (this.chart) {
      this.chart.data.labels = labels;
      this.chart.data.datasets[0].data = salesData;
      this.chart.data.datasets[1].data = marginData;
      this.chart.update();
    }
  }

  private getLocalTimeZone(): string {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }

  private toLocalDate(date: string | Date): Date {
    const timeZone = this.getLocalTimeZone();
    const parsedDate = typeof date === 'string' ? new Date(date) : date;
    return toZonedTime(parsedDate, timeZone);
  }

}