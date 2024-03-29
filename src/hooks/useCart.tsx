import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');
    console.log('Itens do carrinho ',storagedCart)
    if (storagedCart) { //
      return JSON.parse(storagedCart);//
    }//
    
    return [];
  });
  
  const addProduct = async (productId: number) => {
    try {
      const product = cart.find(product => product.id === productId);
      if(product){
        
        updateProductAmount({
          productId: productId,
          amount: product.amount + 1
        })
        console.log('Somando amount');
      }else{
        const {data} = await api.get<Product>('/products/' + productId);
        data.amount = 1;
        setCart([...cart, data])
        console.log('Adicionando item')
        localStorage.setItem('@RocketShoes:cart', JSON.stringify([...cart, data]))
      }

    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const product = [...cart].filter(product => product.id !== productId);
      setCart([...product]);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify([...product]));
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({productId,amount }: UpdateProductAmount) => {
    try {
      const {data} = await api.get('/stock/' + productId);
      const filtro = [...cart].map(carts => {
        if(carts.id === productId && amount <= data.amount){
          carts = {...carts, amount: amount}
          return carts
        }else if(amount > data.amount){
          throw "ForaDoEstoque";
        }
        return carts
      })

      setCart([...filtro])
      console.log('GRRRRRRRRRRRRRRRRRRRRRRR\n',filtro);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify([...filtro]));
   
    } catch (e) {
      if(e === "ForaDoEstoque"){ 
        toast.error('Quantidade solicitada fora do estoque');
      }else{
        toast.error('Erro na alteração de quantidade do produto');}
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
