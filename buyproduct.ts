interface IPricingRule {
  [key: string]: IRule;
}

interface IRule {
  minQuantity?: number;
  exactQuantity?: number;
  maxQuantity?: number;
  normalPrice: number;
  discountedPrice: number;
}

const products = {
  "1": { name: "ipd", price: 549.99 },
  "2": { name: "mbp", price: 1399.99 },
  "3": { name: "atv", price: 109.5 },
  "4": { name: "vga", price: 30.0 },
};

const getProductId = {
  ipd: "1",
  mbp: "2",
  atv: "3",
  vga: "4",
};

class Checkout {
  private scannedProducts: string[];
  private pricingRule: IPricingRule;

  constructor(pricingRule: IPricingRule) {
    this.scannedProducts = [];
    this.pricingRule = pricingRule;
  }

  scan(item: string): void {
    this.scannedProducts.push(getProductId[item]);
  }

  total(): number {
    const productCountsObj: { [key: string]: number } =
      this.scannedProducts.reduce((acc, crr) => {
        acc[crr.toString()] = (acc[crr.toString()] || 0) + 1;
        return acc;
      }, {});

    let total = 0;

    Object.keys(productCountsObj).forEach((ele) => {
      const count = productCountsObj[ele];
      const price = this.getPricing(ele, count);
      total += price;
    });

    return total;
  }

  getPricing(ele: string, quantity: number): number {
    const item = this.pricingRule[ele];

    if (item) {
      const { exactQuantity, maxQuantity, minQuantity, discountedPrice, normalPrice } = item;
      if (exactQuantity) {
        const remainder = quantity % exactQuantity;
        return quantity >= exactQuantity
          ? (quantity - remainder) * discountedPrice + remainder * normalPrice
          : quantity * normalPrice; // in the set of 3 we provide discounts and else remaining we charge normal price
      } else if (minQuantity && maxQuantity) {
        if (quantity < minQuantity) {//quantity is less then min then charge normal price
          return quantity * normalPrice;
        } 
        if (quantity <= maxQuantity) {//quantity between min and max give discount
          return quantity * discountedPrice;
        }
        return maxQuantity * discountedPrice + (quantity - maxQuantity) * normalPrice //if greater then max then upto max give discount and rest charge normal
      } else if (minQuantity) {
        return quantity >= minQuantity
          ? minQuantity * discountedPrice +
              (quantity - minQuantity) * normalPrice // quantity greater then min then upto min give discount and rest charge normal
          : quantity * item.normalPrice; //if quantity is less then min then charge normal price
      }
    }
    return quantity * products[ele].price;
  }
}

class PricingRule {
  private pricingRule: IPricingRule;
  private defaultPricingRule: IPricingRule;

  constructor() {
    this.pricingRule = {};

    //Price of individual product after discounts
    this.defaultPricingRule = {
      "1": {
        minQuantity: 5,
        discountedPrice: 499.99,
        normalPrice: products["1"].price,
      }, // maxQuantity is not defined it means that it will be applied to min quantity and if you keep on adding the discount wont be added it will remain same and only apply once for the minimum critereia
      "3": {
        exactQuantity: 3,
        discountedPrice: (products["3"].price * 2) / 3,
        normalPrice: products["3"].price,
      }, // it implies that on multiples of 3 discount will price of two
      "4": {
        minQuantity: 3,
        discountedPrice: (products["4"].price * 2) / 3,
        maxQuantity: 6,
        normalPrice: products["4"].price,
      }, // this implies that till quantity 6 all quantity will be discounted by 2/3 but if more then that is bought then those extra count will cost original price
    };
  }

  getDefaultRules(): IPricingRule {
    return this.defaultPricingRule;
  }
}

const defaultPricingRule = new PricingRule().getDefaultRules();
const co1 = new Checkout(defaultPricingRule);

co1.scan("atv");
co1.scan("atv");
co1.scan("atv");
co1.scan("vga");
console.log(co1.total());

const co2 = new Checkout(defaultPricingRule);

co2.scan("atv");
co2.scan("ipd");
co2.scan("ipd");
co2.scan("atv");
co2.scan("ipd");
co2.scan("ipd");
co2.scan("ipd");
console.log(co2.total());
