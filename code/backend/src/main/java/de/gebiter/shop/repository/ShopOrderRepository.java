package de.gebiter.shop.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import de.gebiter.shop.model.ShopOrder;

/** Die Belege der Käufe im Gebietermarkt; nur der {@link de.gebiter.shop.service.ShopOrderService} nutzt es. */
public interface ShopOrderRepository extends JpaRepository<ShopOrder, Long> {
}
