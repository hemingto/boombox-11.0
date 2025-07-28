/**
 * @fileoverview Simple route optimization for packing supply deliveries
 * @source boombox-10.0/src/lib/services/simple-route-optimization.ts
 * @refactor No changes to business logic, just file organization
 */

interface DeliveryOrder {
  id: number;
  onfleetTaskId: string;
  deliveryAddress: string;
  contactName: string;
  deliveryWindowStart?: Date;
  deliveryWindowEnd?: Date;
  totalPrice: number;
}

interface OptimizedRoute {
  routeId: string;
  orders: DeliveryOrder[];
  estimatedDistance: number;
  estimatedDuration: number; // in minutes
  startTime: Date;
}

/**
 * Simple route optimization using geographic clustering and basic heuristics
 */
export class SimpleRouteOptimizer {
  private maxStopsPerRoute = 5;
  private maxRouteDuration = 480; // 8 hours in minutes
  private serviceTimePerStop = 10; // 10 minutes per stop

  /**
   * Optimize orders into routes using simple heuristics
   */
  async optimizeOrders(orders: DeliveryOrder[], deliveryDate: Date): Promise<OptimizedRoute[]> {
    console.log(`[SimpleRouteOptimizer] Starting optimization with ${orders.length} orders`);
    console.log(`[SimpleRouteOptimizer] Orders:`, JSON.stringify(orders, null, 2));
    
    if (orders.length === 0) {
      console.log(`[SimpleRouteOptimizer] No orders to optimize, returning empty array`);
      return [];
    }

    console.log(`Optimizing ${orders.length} orders for ${deliveryDate.toDateString()}`);

    // Step 1: Group orders by geographic proximity (simple ZIP-based clustering)
    const clusters = this.clusterOrdersByLocation(orders);
    console.log(`[SimpleRouteOptimizer] Created ${clusters.length} clusters`);
    
    // Step 2: Create routes from clusters
    const routes: OptimizedRoute[] = [];
    let routeCounter = 1;

    for (const cluster of clusters) {
      console.log(`[SimpleRouteOptimizer] Processing cluster with ${cluster.length} orders`);
      const subRoutes = this.createRoutesFromCluster(cluster, deliveryDate, routeCounter);
      routes.push(...subRoutes);
      routeCounter += subRoutes.length;
    }

    console.log(`[SimpleRouteOptimizer] Created ${routes.length} optimized routes`);
    console.log(`[SimpleRouteOptimizer] Routes:`, JSON.stringify(routes, null, 2));
    
    return routes;
  }

  /**
   * Cluster orders by geographic proximity using ZIP codes
   */
  private clusterOrdersByLocation(orders: DeliveryOrder[]): DeliveryOrder[][] {
    const zipClusters: { [zipCode: string]: DeliveryOrder[] } = {};

    for (const order of orders) {
      const zipCode = this.extractZipCode(order.deliveryAddress);
      
      if (!zipClusters[zipCode]) {
        zipClusters[zipCode] = [];
      }
      
      zipClusters[zipCode].push(order);
    }

    // Convert to array of clusters
    return Object.values(zipClusters);
  }

  /**
   * Extract ZIP code from address string
   */
  private extractZipCode(address: string): string {
    // Match 5-digit ZIP codes
    const zipMatch = address.match(/\b\d{5}\b/);
    return zipMatch ? zipMatch[0] : 'unknown';
  }

  /**
   * Create optimized routes from a cluster of orders
   */
  private createRoutesFromCluster(
    orders: DeliveryOrder[], 
    deliveryDate: Date, 
    startRouteCounter: number
  ): OptimizedRoute[] {
    const routes: OptimizedRoute[] = [];

    // Split cluster into routes based on capacity constraints
    const chunks = this.chunkOrdersByCapacity(orders);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const routeId = `ROUTE_${deliveryDate.toISOString().split('T')[0]}_${startRouteCounter + i}`;
      
      // Optimize order sequence within route
      const optimizedOrders = this.optimizeOrderSequence(chunk);
      
      // Calculate route metrics
      const estimatedDistance = this.estimateRouteDistance(optimizedOrders);
      const estimatedDuration = this.estimateRouteDuration(optimizedOrders);
      
      routes.push({
        routeId,
        orders: optimizedOrders,
        estimatedDistance,
        estimatedDuration,
        startTime: new Date(deliveryDate.getTime() + 8 * 60 * 60 * 1000), // 8 AM start
      });
    }

    return routes;
  }

  /**
   * Split orders into chunks based on capacity constraints
   */
  private chunkOrdersByCapacity(orders: DeliveryOrder[]): DeliveryOrder[][] {
    const chunks: DeliveryOrder[][] = [];
    let currentChunk: DeliveryOrder[] = [];

    for (const order of orders) {
      currentChunk.push(order);
      
      if (currentChunk.length >= this.maxStopsPerRoute) {
        chunks.push(currentChunk);
        currentChunk = [];
      }
    }

    if (currentChunk.length > 0) {
      chunks.push(currentChunk);
    }

    return chunks;
  }

  /**
   * Optimize order sequence within a route using simple heuristics
   */
  private optimizeOrderSequence(orders: DeliveryOrder[]): DeliveryOrder[] {
    // Simple optimization: sort by delivery window if available
    return orders.sort((a, b) => {
      if (a.deliveryWindowStart && b.deliveryWindowStart) {
        return a.deliveryWindowStart.getTime() - b.deliveryWindowStart.getTime();
      }
      // Fallback to order ID for consistent ordering
      return a.id - b.id;
    });
  }

  /**
   * Estimate total route distance (simplified calculation)
   */
  private estimateRouteDistance(orders: DeliveryOrder[]): number {
    if (orders.length <= 1) return 0;
    
    // Simple estimate: assume 2 miles between stops on average
    const milesPerStop = 2;
    return orders.length * milesPerStop;
  }

  /**
   * Estimate total route duration including driving and service time
   */
  private estimateRouteDuration(orders: DeliveryOrder[]): number {
    if (orders.length === 0) return 0;
    
    const serviceTime = orders.length * this.serviceTimePerStop;
    const drivingTime = this.estimateRouteDistance(orders) * 3; // 3 minutes per mile average
    
    return serviceTime + drivingTime;
  }

  /**
   * Validate route against constraints
   */
  private validateRoute(route: OptimizedRoute): boolean {
    if (route.orders.length > this.maxStopsPerRoute) {
      console.warn(`Route ${route.routeId} exceeds max stops: ${route.orders.length}`);
      return false;
    }
    
    if (route.estimatedDuration > this.maxRouteDuration) {
      console.warn(`Route ${route.routeId} exceeds max duration: ${route.estimatedDuration} minutes`);
      return false;
    }
    
    return true;
  }

  /**
   * Get optimization statistics for reporting
   */
  getOptimizationStats(originalOrders: DeliveryOrder[], optimizedRoutes: OptimizedRoute[]) {
    const totalOrders = originalOrders.length;
    const totalRoutes = optimizedRoutes.length;
    const averageStopsPerRoute = totalOrders / totalRoutes;
    const totalEstimatedDistance = optimizedRoutes.reduce((sum, route) => sum + route.estimatedDistance, 0);
    const totalEstimatedDuration = optimizedRoutes.reduce((sum, route) => sum + route.estimatedDuration, 0);

    return {
      totalOrders,
      totalRoutes,
      averageStopsPerRoute: Math.round(averageStopsPerRoute * 100) / 100,
      totalEstimatedDistance: Math.round(totalEstimatedDistance * 100) / 100,
      totalEstimatedDuration: Math.round(totalEstimatedDuration),
      averageRouteDistance: Math.round((totalEstimatedDistance / totalRoutes) * 100) / 100,
      averageRouteDuration: Math.round(totalEstimatedDuration / totalRoutes),
    };
  }
}

// Export a singleton instance
export const routeOptimizer = new SimpleRouteOptimizer(); 